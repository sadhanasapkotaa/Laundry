import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>
        This is the laundry chowk frontend
      </h1>

      <button>
        <Link href={/signup}>Signup</Link>
      </button>
    </div>
  );
}
