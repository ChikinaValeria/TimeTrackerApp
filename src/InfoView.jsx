// Component for the Info view with static text, implemented as a Function Component
const InfoView = () => {
 return (
  <div className="view-content-box">
    <h2 className="view-title">Application Information</h2>
    <p className="view-text">
      The name of the author: Chikina Valeriia.
    </p>
    <p className="view-text">
      Using the application should be intuitive and straightforward.
    </p>
    <p className="view-text">
      All the content used in this application is originally created by author.
    </p>
  </div>
 );
};

export default InfoView;
