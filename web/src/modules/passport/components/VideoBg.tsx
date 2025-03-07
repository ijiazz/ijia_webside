export function VideoBg() {
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        top: 0,
        left: 0,
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      <video
        style={{
          height: "100%",
          width: "100vw",
          objectFit: "cover",
        }}
        muted
        autoPlay
        loop
      >
        <source src="/main/bg-login.mp4" type="video/mp4" />
        <img
          src="/main/bg-login.jpg"
          style={{
            height: "100%",
            width: "100%",
            objectFit: "cover",
          }}
        />
      </video>
    </div>
  );
}
