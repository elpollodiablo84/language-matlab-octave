const {CompositeDisposable} = require('atom')
const {TextEditor} = require('atom')

module.exports = {
  subscriptions: null,
  decorations: [],

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.observeTextEditors(
      (activeEditor) => activeEditor.onDidStopChanging(this.persistentHighlight)
    ))

    // this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(
    //   (item) => {
    //     if (item instanceof TextEditor) {
    //       this.persistentHighlight(item)
    //     }
    //   }
    // ))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  persistentHighlight() {
    if (arguments[0] instanceof TextEditor) {
      editor = arguments[0]
    } else {
      editor = atom.workspace.getActiveTextEditor()
    }

    if (editor && editor.getGrammar().scopeName == 'source.matlab') {
      totalRange = [[0, 0], editor.getEofBufferPosition()]

      persistentVars = []

      // Destroy decorations for input/active editor
      if (typeof this.decorations != 'undefined') {
        for (var i = this.decorations.length - 1; i >= 0; i--) {
          if (this.decorations[i][0] == editor.id) {
            this.decorations[i][1].getMarker().destroy()
            this.decorations.splice(i, 1)
          }
        }
      } else {
        this.decorations = []
      }

      // Scan for all variables in the file
      editor.scanInBufferRange(new RegExp('\\b[a-zA-Z]\\w*\\b', 'g'), totalRange,
        (result) => {
          match = result.match
          range = result.range

          // Get the scopeDescriptor and select only the last scope
          scopes = editor.scopeDescriptorForBufferPosition(range.start).getScopesArray()

          if (scopes[scopes.length - 1] == 'meta.variable.persistent.matlab') {
            // Persistent variable found: if the variable is in a function, extract the name
            functionName = getFunctionScopeName(scopes)

            persistentVars.push([functionName, match[0]])
          } else {
            // Check if the variable is in a comment
            isComment = false
            for (var s of scopes) {
              if (s.split('.')[0] == 'comment') {
                isComment = true
                break
              }
            }

            // Check if the variable is in a string
            isString = false
            for (var s of scopes) {
              if (s.split('.')[0] == 'string') {
                isString = true
                break
              }
            }

            // Check if the variable is a property
            isProperty = false
            if (range.start.column > 0) {
              c = editor.getTextInBufferRange([
                [range.start.row, range.start.column - 1],
                range.start])
              if (c == '.') {
                isProperty = true
              }
            }

            // Find function scope name
            functionName = getFunctionScopeName(scopes)

            // Check if the variable has the same name of a persistent variable (in the same function scope)
            isPersistent = false
            for (var v of persistentVars) {
              if (v[0] == functionName && v[1] == match[0]) {
                isPersistent = true
                break
              }
            }

            // Finally decorate the variable
            if (!isComment && !isString && !isProperty && isPersistent) {
              // Decorate variable
              marker = editor.markBufferRange(range)
              d = editor.decorateMarker(marker, {type: 'text', class: 'variable-persistent'})

              this.decorations.push([editor.id, d])
            }
          }
        })
    }
  }
}

function getFunctionScopeName(scopes) {
  functionName = ''
  for (i = scopes.length - 1; i >= 0; i--) {
    if (scopes[i].split('.')[1] == 'function' && scopes[i].split('.')[3] == 'scope') {
      functionName = scopes[i].split('.')[2]
      break
    }
  }

  return functionName
}
