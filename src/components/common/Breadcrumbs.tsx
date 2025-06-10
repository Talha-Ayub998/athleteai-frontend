// components/Breadcrumbs.tsx
import { Link, useLocation } from "react-router-dom";

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex flex-wrap">
        <li>
          <text className="text-blue-600">Home</text>
        </li>
        {paths.map((segment, index) => {
          const path = "/" + paths.slice(0, index + 1).join("/");
          const isLast = index === paths.length - 1;

          return (
            <li key={path} className="flex items-center">
              {<span className="mx-1">/</span>}
              <Link
                to={path}
                className={`hover:underline ${
                  //   isLast ? "text-black" : "text-blue-600"
                  "text-blue-600"
                }`}
              >
                {decodeURIComponent(segment)}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
