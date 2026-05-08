import STTTranscriber from "@/components/STTTranscriber";

export const metadata = {
  title: "STT Streaming Demo",
  description: "실시간 음성인식 스트리밍 데모",
};

export default function STTPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <STTTranscriber />
    </div>
  );
}
