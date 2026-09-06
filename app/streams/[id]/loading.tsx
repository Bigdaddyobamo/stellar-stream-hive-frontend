import { Spinner } from "@/components/ui/Spinner";

export default function LoadingStream() {
  return (
    <div className="mx-auto flex max-w-4xl justify-center px-4 py-24">
      <Spinner size="lg" />
    </div>
  );
}
