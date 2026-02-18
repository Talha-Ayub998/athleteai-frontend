import { Outlet } from "react-router";

const BaseLayout = () => {
  return (
    <>
      <div className="flex-1">
        <Outlet />
      </div>
    </>
  );
};

export default BaseLayout;
