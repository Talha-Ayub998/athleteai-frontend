import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        {/* <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div> */}

        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 ">
              Takedown Attempts
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              10
            </h4>
          </div>
        </div>
        <Badge color="success">
          <ArrowUpIcon />
          15%
        </Badge>
      </div>
      {/* <!-- Metric Item End --> */}
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        {/* <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div> */}

        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 ">
              Takedown Success Rate
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              70
            </h4>
          </div>
        </div>
        <Badge color="success">
          <ArrowUpIcon />
          10%
        </Badge>
      </div>
      {/* <!-- Metric Item End --> */}
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        {/* <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div> */}

        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 ">
              Submissions
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              60%
            </h4>
          </div>
        </div>
        <Badge color="error">
          <ArrowUpIcon />
          20%
        </Badge>
      </div>
      {/* <!-- Metric Item End --> */}
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        {/* <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div> */}

        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 ">
              Points
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              12
            </h4>
          </div>
        </div>
        <Badge color="success">
          <ArrowUpIcon />
          5%
        </Badge>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
