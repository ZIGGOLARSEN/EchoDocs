// "use client";

import Microphone from "@/components/Microphone";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const Page = () => {
  // const [editor] = useLexicalComposerContext();

  return (
    <div>
      <Microphone sendInterval={250} />
    </div>
  );
};

export default Page;
