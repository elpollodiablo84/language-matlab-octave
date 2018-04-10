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

    this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(
      (item) => {
        if (item instanceof TextEditor) {
          this.persistentHighlight()
        }
      }
    ))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  persistentHighlight() {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      totalRange = [[0, 0], editor.getEofBufferPosition()]

      persistentVars = []

      // Destroy decorations for current editor
      for (var i in this.decorations) {
        if (this.decorations[i][0] == editor.id) {
          this.decorations[i][1].getMarker().destroy()
        }
      }
      this.decorations = []

      // Scan for all variables in the file
      editor.scanInBufferRange(new RegExp("\\b[a-zA-Z][0-9a-zA-Z_]*\\b", 'g'), totalRange,
        (result) => {
          match = result.match
          range = result.range

          // Get the scopeDescriptor and select only the last scope
          scopesArray = editor.scopeDescriptorForBufferPosition(range.start).getScopesArray()
          scope = scopesArray[scopesArray.length - 1]

          if (scope == 'meta.variable.persistent.matlab') {
            // Persistent variable found
            persistentVars.push(match[0])
          } else {
            // Check if variable has the same name of a persistent variable and it's not in comment
            if (scope.split('.')[0] != 'comment' && persistentVars.indexOf(match[0]) > -1) {
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
