const {CompositeDisposable, TextEditor, Range} = require('atom');
const {$} = require('atom-space-pen-views');

var MatlabPlus =
  module.exports = {
    subscriptions: null,
    markersPH: [],
    markersSF: [],

    activate() {
      this.subscriptions = new CompositeDisposable();

      this.subscriptions.add(atom.workspace.observeTextEditors(
        (activeEditor) => {
          activeEditor.onDidStopChanging(MatlabPlus.persistentHighlight);
          activeEditor.onDidTokenize(MatlabPlus.persistentHighlight);

          // activeEditor.onDidStopChanging(MatlabPlus.sectionFold);
          // activeEditor.onDidTokenize(MatlabPlus.sectionFold);
          // MatlabPlus.addClickEvent(activeEditor);
        }
      ));
    },

    deactivate() {
      this.subscriptions.dispose();
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
        if (typeof this.markersPH != 'undefined') {
          for (let i = this.markersPH.length - 1; i >= 0; i--) {
            if (this.markersPH[i][0] == editor.id) {
              this.markersPH[i][1].destroy();
              this.markersPH.splice(i, 1);
            }
          }
        } else {
          this.markersPH = [];
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
                marker = editor.markBufferRange(range);
                editor.decorateMarker(marker, {type: 'text', class: 'variable-persistent'});

                this.markersPH.push([editor.id, marker]);
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

      sectionStartLines = []

      // Destroy markersSF for input/active editor
      if (typeof this.markersSF != 'undefined') {
        for (let i = this.markersSF.length - 1; i >= 0; i--) {
          if (this.markersSF[i][0] == editor.id) {
            this.markersSF[i][1].destroy();
            this.markersSF.splice(i, 1);
          }
        }
      } else {
        this.markersSF = [];
      }

      if (editor && editor.getGrammar().scopeName == 'source.matlab') {
        // Scan editor for section start
        L = editor.getLineCount();
        for (let i = 0; i < L; i++) {
          line = editor.lineTextForBufferRow(i).trim();
          if (line.startsWith('%%')) {
            sectionStartLines.push(i);
            marker = editor.markBufferRange([[i, 0], [i, 0]]);
            editor.decorateMarker(marker, {type: 'line-number', class: 'section-start'});

            this.markersSF.push([editor.id, marker]);
          }
        }
      }
    },

    // Auxiliary function: Get all functions names from its grammar scope
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

  		$(gutter).on('click', '.line-number.section-start:not(.folded) .icon-right', function(event) {
  			row = event.target.parentElement.dataset.bufferRow;
        // MatlabPlus.fold(editor, row, row + 3)
  			atom.notifications.addInfo(row.toString());
  		});
  	},

    // Auxiliary function: Fold selected range
    fold(editor, startRow, endRow) {
      rangeToFold = new Range([startRow, Infinity], [endRow, Infinity]);
      editor.setSelectedBufferRange(rangeToFold);
      editor.foldSelectedLines();
    }
  }
