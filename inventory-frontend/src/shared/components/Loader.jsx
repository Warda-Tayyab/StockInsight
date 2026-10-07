/** @module shared/components/Loader */

const Loader = ({ label = 'Loading...' }) => {
  return (
    <div data-testid="loader" className="loading-state">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
};

export default Loader;
