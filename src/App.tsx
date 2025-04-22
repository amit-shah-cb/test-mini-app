import { FC, useEffect } from 'react';
import { sdk } from "@farcaster/frame-sdk";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import ThreeScene from "./components/ThreeScene";

const App: FC = () => {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <>      
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px' }}>
          <div>Mini App + Vite + TS + React + Wagmi</div>
          <ConnectMenu />
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ThreeScene />
        </div>
      </div>
    </>
  );
};

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected) {
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        <SignButton />
      </>
    );
  }

  return (
    <button type="button" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </button>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <>
      <button type="button" onClick={() => signMessage({ message: "hello world" })} disabled={isPending}>
        {isPending ? "Signing..." : "Sign message"}
      </button>
      {data && (
        <>
          <div>Signature</div>
          <div>{data}</div>
        </>
      )}
      {error && (
        <>
          <div>Error</div>
          <div>{error.message}</div>
        </>
      )}
    </>
  );
}

export default App;
