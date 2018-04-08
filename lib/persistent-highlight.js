const {CompositeDisposable} = require('atom')

module.exports = {
  subscriptions: null,
  decorations: [],

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.workspace.observeTextEditors(
      (activeEditor) => activeEditor.onDidChange(this.persistentHighlight)
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
      for (var d in this.decorations) {
        this.decorations[d].getMarker().destroy()
      }
      this.decorations = []

      // Scan for all variables in the file
      editor.scanInBufferRange(new RegExp("\\b[a-zA-Z]\\w*\\b", 'g'), totalRange,
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
            // Check if variable has the same name of a persistent variable
            if (persistentVars.indexOf(match[0]) > -1) {
              // Decorate variable
              marker = editor.markBufferRange(range)
              d = editor.decorateMarker(marker, {type: 'text', class: 'variable-persistent'})

              this.decorations.push(d)
            }
          }
        })

    }

  }
}
