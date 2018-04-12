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
            // Persistent variable found
            persistentVars.push(match[0])
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

            // Check if the variable has the same name of a persistent variable
            if (!isComment && !isString && !isProperty && persistentVars.indexOf(match[0]) > -1) {
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
