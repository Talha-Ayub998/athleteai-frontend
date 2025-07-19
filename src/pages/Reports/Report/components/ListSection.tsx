const ListSection = ({ list }) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
        {list?.title}
      </h2>
      <ul className="list-disc ml-6">
        {list?.data?.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default ListSection;
