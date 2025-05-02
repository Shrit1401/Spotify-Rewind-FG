import Link from "next/link";
import BuildWithForgeZone from "@/components/BuildWithForgeZone";

const Home = () => {
  return (
    <div className="root">
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Rude Spotify Rewind</h1>
          </div>
          <div className="header-subtitle">
            <h2>Exposing your terrible music taste with zero mercy by Shrit</h2>
          </div>

          <div className="button-container">
            <Link href="/api/auth">
              <button className="button">Login with Spotify</button>
            </Link>
          </div>
        </div>
      </div>
      <BuildWithForgeZone />
    </div>
  );
};

export default Home;
