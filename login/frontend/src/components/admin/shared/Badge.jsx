import "./shared.css";

const Badge = ({ variant = "default", children }) => {
  return (
    <span className={`admin-badge badge-${variant}`}>
      {children}
    </span>
  );
};

export default Badge;
