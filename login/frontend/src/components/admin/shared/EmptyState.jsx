import "./shared.css";

const EmptyState = ({ icon = "📭", title = "Nothing here yet", subtitle = "" }) => {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h4>{title}</h4>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
};

export default EmptyState;
