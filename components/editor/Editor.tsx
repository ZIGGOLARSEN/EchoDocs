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
import { useEffect } from "react";
import { LexicalComposerContextWithEditor, useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { FloatingComposer, FloatingThreads, liveblocksConfig, LiveblocksPlugin, useEditorStatus } from "@liveblocks/react-lexical";
import Microphone from "../Microphone";
import Loader from "../Loader";

import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import { useThreads } from "@liveblocks/react/suspense";
import Comments from "../Comments";
import { DeleteModal } from "../DeleteModal";
import { LexicalEditor, LexicalNode, RootNode } from "lexical";

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.

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

  const setTextContent = (newText: string) => {
    editor.update(() => {
      const values = editor.getEditorState()._nodeMap.values();
      const valueArray = Array.from(values);

      if (valueArray.length == 3) {
        const textNode = valueArray[valueArray.length - 1] as any;

        const currentTextContent = textNode.getTextContent();

        textNode.setTextContent(currentTextContent + newText);
        textNode.selectEnd();
      }
    });
  };

  useEffect(() => {
    setTextContent("");
  });

  return (
    <div className="editor-container">
      <div className="flex justify-center items-center">
        <div className="toolbar-wrapper sm:max-w-[80%] flex justify-between">
          <ToolbarPlugin />
          <Microphone sendInterval={250} />
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
