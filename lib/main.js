const {CompositeDisposable, TextEditor, Range} = require('atom');
const {$} = require('atom-space-pen-views');

var MatlabPlus =
  module.exports = {
    subscriptions: null,
    markersPH: [],
    markersSF: [],
    sectionBounds: [],

    activate() {
      MatlabPlus.subscriptions = new CompositeDisposable();

      MatlabPlus.subscriptions.add(atom.workspace.observeTextEditors(
        (activeEditor) => {
          activeEditor.onDidStopChanging(MatlabPlus.persistentHighlight);
          activeEditor.onDidTokenize(MatlabPlus.persistentHighlight);

          activeEditor.onDidStopChanging(MatlabPlus.sectionFold);
          activeEditor.onDidTokenize(MatlabPlus.sectionFold);
          MatlabPlus.addClickEvent(activeEditor);
        }
      ));
    },

    deactivate() {
      MatlabPlus.subscriptions.dispose();
    },

    // Main functionality: Persistent variables highlighing
    persistentHighlight() {
      if (arguments[0] instanceof TextEditor) {
        editor = arguments[0];
      } else {
        editor = atom.workspace.getActiveTextEditor();
      }

      if (editor && editor.getGrammar().scopeName == 'source.matlab') {
        totalRange = [[0, 0], editor.getEofBufferPosition()];

        persistentVars = [];

        // Destroy markersPH for input/active editor
        if (typeof MatlabPlus.markersPH != 'undefined') {
          for (let i = MatlabPlus.markersPH.length - 1; i >= 0; i--) {
            if (MatlabPlus.markersPH[i][0] == editor.id) {
              MatlabPlus.markersPH[i][1].destroy();
              MatlabPlus.markersPH.splice(i, 1);
            }
          }
        } else {
          MatlabPlus.markersPH = [];
        }

        // Scan for all variables in the file
        editor.scanInBufferRange(new RegExp('\\b[a-zA-Z]\\w*\\b', 'g'), totalRange,
          (result) => {
            match = result.match;
            range = result.range;

            // Get the scopeDescriptor
            scopes = editor.scopeDescriptorForBufferPosition(range.start).getScopesArray();

            if (scopes[scopes.length - 1] == 'meta.variable.persistent.matlab') {
              // Persistent variable found: if the variable is in a function, extract the name
              functionNames = MatlabPlus.getFunctionScopeName(scopes);

              persistentVars.push([functionNames[0], match[0]]);
            } else {
              // Check if the variable is in a comment
              isComment = false;
              for (let s of scopes) {
                if (s.split('.')[0] == 'comment') {
                  isComment = true;
                  break
                }
              }

              // Check if the variable is in a string
              isString = false;
              for (let s of scopes) {
                if (s.split('.')[0] == 'string') {
                  isString = true;
                  break
                }
              }

              // Check if the variable is a property
              isProperty = false;
              if (range.start.column > 0) {
                c = editor.getTextInBufferRange([
                  [range.start.row, range.start.column - 1],
                  range.start]);
                if (c == '.') {
                  isProperty = true;
                }
              }

              // Find function scope name
              functionNames = MatlabPlus.getFunctionScopeName(scopes);

              // Check if the variable has the same name of a persistent variable (in the same function scope)
              isPersistent = false;
              for (let v of persistentVars) {
                if (v[1] == match[0] &&  functionNames.includes(v[0])) {
                  isPersistent = true;
                  break
                }
              }

              // Finally decorate the variable
              if (!isComment && !isString && !isProperty && isPersistent) {
                // Decorate variable
                marker = editor.markBufferRange(range, {invalidate: 'touch'});
                editor.decorateMarker(marker, {type: 'text', class: 'variable-persistent'});

                MatlabPlus.markersPH.push([editor.id, marker]);
              }
            }
          });
      }
    },

    // Main functionality: Scan section
    sectionFold() {
      if (arguments[0] instanceof TextEditor) {
        editor = arguments[0];
      } else {
        editor = atom.workspace.getActiveTextEditor();
      }

      // Destroy sectionBounds array
      if (typeof MatlabPlus.sectionBounds != 'undefined') {
        for (let i = MatlabPlus.sectionBounds.length - 1; i >= 0; i--) {
          if (MatlabPlus.sectionBounds[i][0] == editor.id) {
            MatlabPlus.sectionBounds.splice(i, 1);
          }
        }
      } else {
        MatlabPlus.sectionBounds = [];
      }

      // Destroy markersSF for input/active editor
      if (typeof MatlabPlus.markersSF != 'undefined') {
        for (let i = MatlabPlus.markersSF.length - 1; i >= 0; i--) {
          if (MatlabPlus.markersSF[i][0] == editor.id) {
            MatlabPlus.markersSF[i][1].destroy();
            MatlabPlus.markersSF.splice(i, 1);
          }
        }
      } else {
        MatlabPlus.markersSF = [];
      }

      if (editor && editor.getGrammar().scopeName == 'source.matlab') {
        linesNotClosed = [];

        // Scan editor for section start
        L = editor.getLineCount();
        for (let i = 0; i < L; i++) {
          line = editor.lineTextForBufferRow(i).trim();
          nextLine = editor.lineTextForBufferRow(Math.min(i + 1, L - 1)).trim();

          // Check if the line is the beginning of a section
          if (line.startsWith('%%')) {
            linesNotClosed.push(i)

            // Decoration
            marker = editor.markBufferRange([[i, 0], [i, 0]]);
            editor.decorateMarker(marker, {type: 'line', class: 'section-line'});
            editor.decorateMarker(marker, {type: 'line-number', class: 'section-start'});

            MatlabPlus.markersSF.push([editor.id, marker]);
          }

          // Check if the line is the end of a section
          if (nextLine.startsWith('%%')) {
            // Pick the last not closed lines
            if (linesNotClosed.length == 0) {
              startSection = 0;
            } else {
              startSection = linesNotClosed[linesNotClosed.length - 1];
            }

            MatlabPlus.sectionBounds.push([editor.id, startSection, i]);
            linesNotClosed.splice(linesNotClosed.length - 1, 1);
          }
        }

        // Calculate the last section bound
        if (linesNotClosed.length > 0) {
          MatlabPlus.sectionBounds.push([editor.id, linesNotClosed[0], L - 1]);
        }
      }
    },

    // Auxiliary function: Get all functions names from the grammar scope
    getFunctionScopeName(scopes) {
      functionNames = [];
      for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i].split('.')[1] == 'function' && scopes[i].split('.')[3] == 'scope') {
          functionNames.push(scopes[i].split('.')[2]);
        }
      }

      return functionNames;
    },

    // Auxiliary function: Add Click-to-Fold event to the gutter
    addClickEvent(editor) {
  		editorView = atom.views.getView(editor);
  		gutter = editorView.querySelector('.gutter');

  		$(gutter).on('mousedown', '.line-number.section-start:not(.folded) .icon-right', function(event) {
  			startRow = Number(event.target.parentElement.dataset.bufferRow);

        for (let i = 0; i < MatlabPlus.sectionBounds.length; i++) {
          if (MatlabPlus.sectionBounds[i][0] == editor.id && MatlabPlus.sectionBounds[i][1] == startRow) {
            endRow = MatlabPlus.sectionBounds[i][2];
            break
          }
        }

        editor.setSelectedBufferRange([[startRow, Infinity], [endRow, Infinity]]);
        editor.foldSelectedLines();
  		});
  	}

  }
