interface HeaderProps {
  username: string;
}

export default function Header({ username }: HeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold text-[#1F2937]">
        Hi there, <span className="purple-gradient-text">{username}</span>
      </h1>
      <h2 className="text-3xl font-bold purple-gradient-text mb-2">
        What would like to know?
      </h2>
      <p className="text-[#6B7280]">
        Use one of the most common prompts below or use your own to begin
      </p>
    </div>
  );
}
