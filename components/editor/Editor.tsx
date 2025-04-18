"use client";

import Theme from "./plugins/Theme";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { FloatingComposer, FloatingThreads, liveblocksConfig, LiveblocksPlugin, useEditorStatus } from "@liveblocks/react-lexical";
import Microphone from "../Microphone";
import Loader from "../Loader";

import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import { useThreads } from "@liveblocks/react/suspense";
import Comments from "../Comments";
import { DeleteModal } from "../DeleteModal";
import { $getRoot, $createTextNode, $getSelection, ParagraphNode, RootNode, TextNode, $isRangeSelection } from "lexical";

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}

export function Editor({ roomId, currentUserType }: { roomId: string; currentUserType: UserType }) {
  const status = useEditorStatus();
  const { threads } = useThreads();

  const initialConfig = liveblocksConfig({
    namespace: "Editor",
    nodes: [HeadingNode],
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    theme: Theme,
    editable: currentUserType === "editor",
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContent roomId={roomId} currentUserType={currentUserType} status={status} threads={threads} />
    </LexicalComposer>
  );
}

function EditorContent({ roomId, currentUserType, status, threads }: { roomId: string; currentUserType: UserType; status: any; threads: any }) {
  const [editor] = useLexicalComposerContext();

  const handleTranscriptUpdate = useCallback(
    (newText: string) => {
      if (!newText) return;

      editor.update(() => {
        const selection = $getSelection();
        const root = $getRoot();
        const transcriptSegment = " " + newText; // Add a space for better flow

        if ($isRangeSelection(selection)) {
          // If there's a selection (cursor is active or text is highlighted),
          // insert the transcript text at that position.
          selection.insertText(transcriptSegment);
        } else {
          // If there's no active selection, append to the end of the document.
          const lastNode = root.getLastDescendant();

          if (lastNode instanceof TextNode) {
            // Append to the last text node if possible
            lastNode.setTextContent(lastNode.getTextContent() + transcriptSegment);
            lastNode.selectEnd(); // Move cursor after inserted text
          } else {
            // Otherwise, create a new paragraph with the text node
            let targetNode: ParagraphNode | RootNode;
            if (lastNode instanceof ParagraphNode && lastNode.getTextContentSize() === 0) {
              // If last node is an empty paragraph, use it
              targetNode = lastNode;
            } else if (lastNode instanceof ParagraphNode) {
              // If last node is a paragraph with content, append text node to it
              const textNode = $createTextNode(transcriptSegment);
              lastNode.append(textNode);
              lastNode.selectEnd();
              return; // Exit early as we've handled it
            } else {
              // Otherwise append a new paragraph to the root
              const newParagraph = new ParagraphNode();
              root.append(newParagraph);
              targetNode = newParagraph;
            }
            const textNode = $createTextNode(transcriptSegment);
            targetNode.append(textNode);
            targetNode.selectEnd(); // Move cursor to end of new paragraph
          }
        }
      });
    },
    [editor]
  );

  return (
    <div className="editor-container">
      <div className="flex justify-center items-center">
        <div className="toolbar-wrapper sm:max-w-[80%] flex justify-between">
          <ToolbarPlugin />
          <Microphone sendInterval={250} onTranscriptUpdate={handleTranscriptUpdate} />
          {currentUserType === "editor" && <DeleteModal roomId={roomId} />}
        </div>
      </div>

      <div className="editor-wrapper flex flex-col items-center justify-start">
        {status === "not-loaded" || status === "loading" ? (
          <Loader />
        ) : (
          <div className="editor-inner min-h-[1100px] relative mb-5 h-fit w-full max-w-[800px] shadow-md lg:mb-10">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input h-full" />}
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            {currentUserType === "editor" && <FloatingToolbarPlugin />}
            <HistoryPlugin />
            <AutoFocusPlugin />
          </div>
        )}

        <LiveblocksPlugin>
          <FloatingComposer className="w-[350px]" />
          <FloatingThreads threads={threads} />
          <Comments />
        </LiveblocksPlugin>
      </div>
    </div>
  );
}
