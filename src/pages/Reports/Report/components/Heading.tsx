import { formatDate } from "../../../../utils/reports/formatDate";

const Heading = ({ athleteName, reportDate }) => {
  return (
    <div className="px-6">
      <div className="flex justify-center items-center flex-col">
        <h1 className="text-2xl font-bold text-brand-500 dark:text-brand-400 mb-2 text-center">
          Jiu-Jitsu Athlete Performance Analysis
        </h1>
        <div className="text-center">
          <p className="text-base font-medium text-gray-800 dark:text-white/90 mt-2">
            Athlete: {athleteName}
          </p>
          <p className="text-base font-medium text-gray-800 dark:text-white/90 mt-2">
            Report Date: {formatDate(reportDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Heading;
