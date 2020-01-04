import React, { Component } from 'react';
import { render } from 'react-dom';
import {
  Editor,
  EditorState,
  ContentState,
  RichUtils,
  convertToRaw,
} from 'draft-js';
import styled from 'styled-components';
import { stateToHTML } from 'draft-js-export-html';

import './style';
import decorator from './decorators';
import Input from './containers/Input';
import CommentButton from './components/CommentButton';
import ToolbarButton from './components/ToolbarButton';
import Image from './components/Image';
import { insertImage, getEditorData } from './helpers/editor';
import { getSelected, getPosition } from './helpers/selection';

const Toolbar = styled.div`
  div {
    &:first-child {
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }
    &:last-child {
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }
`;

class App extends Component {
  constructor() {
    super();
    this.state = {
      showLinkInput: false,
      showCommentInput: false,
      showExportedHTML: false,
      exportedOptions: {},
      position: {},
      editorState: EditorState.createWithContent(
        ContentState.createFromText(
          `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
        ),
      ),
    };
  }
  _onChange = editorState => {
    this.setState({ editorState });
  };
  _onBoldClick = e => {
    e.preventDefault();
    this._onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  };
  _onLinkClick = e => {
    e.preventDefault();
    this.setState({
      showLinkInput: true,
    });
  };
  _onLinkInputClose = () => {
    this.setState({
      showLinkInput: false,
    });
  };
  _onImageClick = e => {
    e.preventDefault();
    this.imgUpload.click();
  };
  _onCommentClick = e => {
    e.preventDefault();
    this.setState({
      showCommentInput: true,
    });
  };
  _onCommentInputClose = () => {
    this.setState({
      showCommentInput: false,
    });
  };
  _onExportClick = e => {
    e.preventDefault();
    this.setState(({ showExportedHTML }) => ({
      showExportedHTML: !showExportedHTML,
      exportedOptions: {
        entityStyleFn: entity => {
          const entityType = entity.get('type');
          if (entityType === 'COMMENT') {
            const data = entity.getData();
            return {
              element: 'span',
              attributes: {
                'data-value': data.value,
              },
              style: {
                backgroundColor: '#ffedf2',
              },
            };
          }
        },
      },
    }));
  };
  startUploadFile = () => {
    if (this.imgUpload.files && this.imgUpload.files[0]) {
      this.handleUploadImage(this.imgUpload.files[0]);
    }
  };
  handleUploadImage = file => {
    var fr = new FileReader();
    fr.addEventListener('load', e => {
      this._onChange(
        insertImage(this.state.editorState, { src: e.target.result }),
      );
    });
    fr.readAsDataURL(file);
  };
  _onMouseOrKeyUp = () => {
    var selected = getSelected();
    if (selected.rangeCount > 0) {
      setTimeout(() => {
        this.setState({
          position: getPosition(selected),
        });
      }, 1);
    }
  };
  componentDidMount() {
    this.imgUpload = document.getElementById('imgUpload');
    this.imgUpload.addEventListener('change', this.startUploadFile, false);
    this._onChange(
      EditorState.set(this.state.editorState, {
        decorator: decorator({
          clickComment: this._onCommentClick,
          clickLink: this._onLinkClick,
        }),
      }),
    );
  }
  componentWillUnmount() {
    this.imgUpload.removeEventListener('change', this.startUploadFile);
  }
  render() {
    const {
      showCommentInput,
      showLinkInput,
      showExportedHTML,
      exportedOptions,
      position,
      editorState,
    } = this.state;
    const { contentState } = getEditorData(editorState);
    return (
      <div style={containerStyle}>
        <Toolbar>
          <ToolbarButton icon="bold" onClick={this._onBoldClick}>
            Bold
          </ToolbarButton>
          <ToolbarButton icon="link" onClick={this._onLinkClick}>
            Link
          </ToolbarButton>
          <ToolbarButton icon="file-image-o" onClick={this._onImageClick}>
            Image
          </ToolbarButton>
          <ToolbarButton icon="commenting-o" onClick={this._onCommentClick}>
            Comment
          </ToolbarButton>
          <ToolbarButton icon="code" onClick={this._onExportClick}>
            Code
          </ToolbarButton>
        </Toolbar>
        <div
          style={{
            margin: '1rem 0',
          }}
          onKeyUp={this._onMouseOrKeyUp}
          onMouseUp={this._onMouseOrKeyUp}
        >
          {!showExportedHTML && (
            <Editor
              ref={element => (this.editor = element)}
              editorState={editorState}
              onChange={this._onChange}
              blockRendererFn={block => {
                if (block.getType() === 'atomic') {
                  return {
                    component: Image,
                    editable: false,
                    props: {
                      onClick: e => {},
                    },
                  };
                }
              }}
              blockStyleFn={block => {
                if (block.getType() === 'atomic') {
                  return 'atomic-block';
                }
              }}
              customStyleMap={{
                SELECTED: {
                  background: '#e2f2ff',
                },
              }}
            />
          )}
          {showExportedHTML && stateToHTML(contentState, exportedOptions)}
        </div>
        {showLinkInput && (
          <Input
            entityType="LINK"
            placeholder="Paste link address"
            editorState={editorState}
            onChange={this._onChange}
            position={position}
            onClose={this._onLinkInputClose}
          />
        )}
        {showCommentInput && (
          <Input
            entityType="COMMENT"
            placeholder="Write down some comment..."
            editorState={editorState}
            onChange={this._onChange}
            position={position}
            onClose={this._onCommentInputClose}
          />
        )}
        <pre>{JSON.stringify(convertToRaw(contentState), null, 2)}</pre>
        <CommentButton
          disabled={getSelected().isCollapsed || showCommentInput}
          position={position}
          onClick={this._onCommentClick}
        />
        <input type="file" id="imgUpload" style={{ display: 'none' }} />
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));

const containerStyle = {
  position: 'relative',
};
