import Microphone from "@/components/Microphone";

const page = () => {
  return (
    <div>
      <Microphone
        apiKey={process.env.DEEPGRAM_API_KEY as string}
        sendInterval={250}
      />
    </div>
  );
};

export default page;
