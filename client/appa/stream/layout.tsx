const StreamLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen space-y-3">
      {/* <Logo /> */}
      {children}
    </div>
  );
};
export default StreamLayout;
