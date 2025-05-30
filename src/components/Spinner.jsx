import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import '../styles/spinner.css';

const Spinner = ({ text = 'טוען נתונים...' }) => (
  <div className="fa-table-spinner-box">
    <div className="fa-table-spinner-motion">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" />
    </div>
    <div className="fa-table-spinner-text">{text}</div>
  </div>
);

export default Spinner;
