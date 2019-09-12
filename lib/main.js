/* global atom */
const { CompositeDisposable, TextEditor } = require('atom')
const { $ } = require('atom-space-pen-views')

var MatlabPlus =
  module.exports = {
    subscriptions: null,
    markersPH: [],
    markersSF: [],
    sectionBounds: [],

    activate () {
      MatlabPlus.subscriptions = new CompositeDisposable()

      MatlabPlus.subscriptions.add(atom.workspace.observeTextEditors(
        (activeEditor) => {
          activeEditor.onDidStopChanging(MatlabPlus.persistentHighlight)
          activeEditor.onDidTokenize(MatlabPlus.persistentHighlight)

          activeEditor.onDidStopChanging(MatlabPlus.sectionFold)
          activeEditor.onDidTokenize(MatlabPlus.sectionFold)
          MatlabPlus.addClickEvent(activeEditor)
        }
      ))
    },

    deactivate () {
      MatlabPlus.subscriptions.dispose()
    },

    // Main functionality: Persistent variables highlighing
    persistentHighlight () {
      var editor = (arguments[0] instanceof TextEditor)
        ? arguments[0]
        : atom.workspace.getActiveTextEditor()

      if (typeof editor !== 'undefined') {
        if (editor && editor.getGrammar().scopeName === 'source.matlab') {
          var totalRange = [[0, 0], editor.getEofBufferPosition()]

          var persistentVars = []

          // Destroy markersPH for input/active editor
          if (typeof MatlabPlus.markersPH !== 'undefined') {
            for (let i = MatlabPlus.markersPH.length - 1; i >= 0; i--) {
              if (MatlabPlus.markersPH[i].id === editor.id) {
                MatlabPlus.markersPH[i].marker.destroy()
                MatlabPlus.markersPH.splice(i, 1)
              }
            }
          } else {
            MatlabPlus.markersPH = []
          }

          // Scan for all variables in the file
          editor.scanInBufferRange(new RegExp('\\b[a-zA-Z]\\w*\\b', 'g'), totalRange,
            (result) => {
              var match = result.match
              var range = result.range

              // Get the scopeDescriptor
              var scopes = editor.scopeDescriptorForBufferPosition(range.start).getScopesArray()

              if (scopes[scopes.length - 1] === 'meta.variable.persistent.matlab') {
                // Persistent variable found: if the variable is in a function, extract the name
                var functionNames = MatlabPlus.getFunctionNamesFromScopes(scopes)

                persistentVars.push({
                  function: functionNames[0],
                  var: match[0]
                })
              } else {
                // Check if the variable is in a comment
                var isComment = false
                for (const s of scopes) {
                  if (s.split('.')[0] === 'comment') {
                    isComment = true
                    break
                  }
                }

                // Check if the variable is in a string
                var isString = false
                for (const s of scopes) {
                  if (s.split('.')[0] === 'string') {
                    isString = true
                    break
                  }
                }

                // Check if the variable is a property
                var isProperty = false
                if (range.start.column > 0) {
                  var c = editor.getTextInBufferRange([[range.start.row, range.start.column - 1], range.start])
                  if (c === '.') {
                    isProperty = true
                  }
                }

                // Find function scope name
                functionNames = MatlabPlus.getFunctionNamesFromScopes(scopes)

                // Check if the variable has the same name of a persistent variable (in the same function scope)
                var isPersistent = false
                for (const v of persistentVars) {
                  if (v.var === match[0] && functionNames.includes(v.function)) {
                    isPersistent = true
                    break
                  }
                }

                // Finally decorate the variable
                if (!isComment && !isString && !isProperty && isPersistent) {
                  // Decorate variable
                  var marker = editor.markBufferRange(range, { invalidate: 'touch' })
                  editor.decorateMarker(marker, { type: 'text', class: 'variable-persistent' })

                  MatlabPlus.markersPH.push({
                    id: editor.id,
                    marker: marker
                  })
                }
              }
            })
        }
      }
    },

    // Main functionality: Scan section
    sectionFold () {
      var editor = (arguments[0] instanceof TextEditor)
        ? arguments[0]
        : atom.workspace.getActiveTextEditor()

      if (typeof editor !== 'undefined') {
        // Destroy sectionBounds array
        if (typeof MatlabPlus.sectionBounds !== 'undefined') {
          for (let i = MatlabPlus.sectionBounds.length - 1; i >= 0; i--) {
            if (MatlabPlus.sectionBounds[i].id === editor.id) {
              MatlabPlus.sectionBounds.splice(i, 1)
            }
          }
        } else {
          MatlabPlus.sectionBounds = []
        }

        // Destroy markersSF for input/active editor
        if (typeof MatlabPlus.markersSF !== 'undefined') {
          for (let i = MatlabPlus.markersSF.length - 1; i >= 0; i--) {
            if (MatlabPlus.markersSF[i].id === editor.id) {
              MatlabPlus.markersSF[i].marker.destroy()
              MatlabPlus.markersSF.splice(i, 1)
            }
          }
        } else {
          MatlabPlus.markersSF = []
        }

        if (editor && editor.getGrammar().scopeName === 'source.matlab') {
          var sectionsNotClosed = []

          // Scan editor for section start
          var L = editor.getLineCount()
          for (let i = 0; i < L; i++) {
            var iNext = Math.min(i + 1, L - 1)
            var line = editor.lineTextForBufferRow(i).trim()
            var nextLine = editor.lineTextForBufferRow(iNext)// .trim()

            var nextLineIsComment = nextLine.trim().startsWith('%%')
            var nextLineIsEnd = nextLine.search(/^[\t ]*end(?:[%;,\s]|$)/) === 0
            var nextLineIsMidBlock = nextLine.search(/^[\t ]*else(?:[%,\s]|$)/) === 0 ||
                                     nextLine.search(/^[\t ]*elseif[\t ]/) === 0 ||
                                     nextLine.search(/^[\t ]*catch(?:[%,\s]|$)/) === 0 ||
                                     nextLine.search(/^[\t ]*case[\t ]/) === 0 ||
                                     nextLine.search(/^[\t ]*otherwise(?:[%,\s]|$)/) === 0

            // Check if the line is the beginning of a section
            if (line.startsWith('%%')) {
              var scopesStart = editor.scopeDescriptorForBufferPosition([i, 0]).getScopesArray()
              sectionsNotClosed.push({
                row: i,
                blocks: MatlabPlus.getBlocksFromScopes(scopesStart),
                functions: MatlabPlus.getFunctionNamesFromScopes(scopesStart)
              })

              // Decoration
              var markerStart = editor.markBufferRange([[i, 0], [i, 0]])
              editor.decorateMarker(markerStart, { type: 'line', class: 'section-start-line' })
              editor.decorateMarker(markerStart, { type: 'line-number', class: 'section-start' })

              MatlabPlus.markersSF.push({
                id: editor.id,
                marker: markerStart
              })
            }

            // Check if the line is a possible end of a section
            if (nextLineIsComment || nextLineIsEnd || nextLineIsMidBlock) {
              var scopesEndNext = editor.scopeDescriptorForBufferPosition([iNext, 0]).getScopesArray()
              var scopesEnd = editor.scopeDescriptorForBufferPosition([i, 0]).getScopesArray()
              var blocks = MatlabPlus.getBlocksFromScopes(scopesEndNext)
              var functions = MatlabPlus.getFunctionNamesFromScopes(scopesEnd)
              if (nextLineIsMidBlock) {
                // If nextLine is an "else", "catch", etc... , then the last block in the scope
                // starts from nextLine and it shouldn't be considered
                blocks = blocks.slice(0, -1)
              }

              var startSection = -1

              if (sectionsNotClosed.length > 0) {
                // Check if there is an open section in the same block AND in the same function
                for (let j = sectionsNotClosed.length - 1; j >= 0; j--) {
                  var isSameBlock = (sectionsNotClosed[j].blocks.join() === blocks.join())
                  var isSameFunction = (sectionsNotClosed[j].functions.join() === functions.join())

                  if (isSameBlock && isSameFunction) {
                    startSection = sectionsNotClosed[j].row
                    sectionsNotClosed.splice(j, 1)
                    break
                  }
                }
              } else if (nextLineIsComment) {
                startSection = 0
              }

              if (startSection >= 0) {
                MatlabPlus.sectionBounds.push({
                  id: editor.id,
                  start: startSection,
                  end: i
                })

                if (!nextLineIsComment) {
                  // Decoration
                  var markerEnd = editor.markBufferRange([[i, 0], [i, 0]])
                  editor.decorateMarker(markerEnd, { type: 'line', class: 'section-end-line' })

                  MatlabPlus.markersSF.push({
                    id: editor.id,
                    marker: markerEnd
                  })
                }
              }
            }
          }

          // Calculate the last section bound
          if (sectionsNotClosed.length > 0) {
            MatlabPlus.sectionBounds.push({
              id: editor.id,
              start: sectionsNotClosed[0].row,
              end: L - 1
            })
          }
        }
      }
    },

    // Auxiliary function: Get all functions names from the grammar scope
    getFunctionNamesFromScopes (scopes) {
      var functionNames = []
      for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i].split('.')[1] === 'function' &&
            (scopes[i].split('.')[3] === 'scope' || scopes[i].split('.')[3] === 'line')) {
          functionNames.push(scopes[i].split('.')[2])
        }
      }

      return functionNames
    },

    // Auxiliary function: Get all the blocks (if, while, for, ...) of the scope
    getBlocksFromScopes (scopes) {
      var blocks = []
      for (let i = 0; i < scopes.length; i++) {
        if (scopes[i].split('.')[0] === 'meta' && scopes[i].split('.')[1] !== 'function') {
          blocks.push(scopes[i])
        }
      }

      return blocks
    },

    // Auxiliary function: Get section bounds for line
    getSectionBounds (editor, lineNumber) {
      for (let i = 0; i < MatlabPlus.sectionBounds.length; i++) {
        if (MatlabPlus.sectionBounds[i].id === editor.id &&
            MatlabPlus.sectionBounds[i].start <= lineNumber && MatlabPlus.sectionBounds[i].end >= lineNumber) {
          return [MatlabPlus.sectionBounds[i].start, MatlabPlus.sectionBounds[i].end]
        }
      }
    },

    // Provider: Provide getSectionBounds to other packages
    provideSectionBounds () {
      return MatlabPlus.getSectionBounds
    },

    // Auxiliary function: Add Click-to-Fold event to the gutter
    addClickEvent (editor) {
      var editorView = atom.views.getView(editor)
      var gutter = editorView.querySelector('.gutter')

      $(gutter).on('mousedown', '.line-number.section-start:not(.folded) .icon-right', function (event) {
        var startRow = Number(event.target.parentElement.dataset.bufferRow)

        for (let i = 0; i < MatlabPlus.sectionBounds.length; i++) {
          if (MatlabPlus.sectionBounds[i].id === editor.id && MatlabPlus.sectionBounds[i].start === startRow) {
            var endRow = MatlabPlus.sectionBounds[i].end
            break
          }
        }

        editor.setSelectedBufferRange([[startRow, Infinity], [endRow, Infinity]])
        editor.foldSelectedLines()
      })
    }

  }
