import React from "react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen, faBan, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../styles/Profile.css";

const labelMap = {
    name: "שם",
    email: "דוא\"ל",
    phone: "טלפון",
    password: "סיסמא"
  };
  

const Profile = () => {

    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    
    const [formData, setFormData] = useState({
        name: 'עבדאלרחמן',
        email: 'example.example@gmail.com',
        phone: '123-456-7890',
        password: 'abcdefg'
    });
    
    const [originalData, setOriginalData] = useState(formData);

    const getUserInfo = () => {
        return Object.keys(formData).map((key, index) => {
          const value = key === "password" && !isEditing ? "********" : formData[key];
          return (
            <tr key={index}>
              <td>{labelMap[key]}:</td>
              <td>{value}</td>
            </tr>
          );
        });
      };

    const renderFormGroup = (label, key, type = 'text') => {
        const isPassword = key === 'password';
      
        if (isPassword) {
          return (
            <div className="form-group input-with-icon" key={key}>
              <label htmlFor={key}>{label}</label>
              <div className="input-wrapper">
                <input
                  id={key}
                  type={showPassword ? 'text' : 'password'}
                  value={formData[key]}
                  required
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="eye-button"
                  aria-label="Toggle password visibility"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="pass-eye-icon" />
                </button>
              </div>
            </div>
          );
        }
      
        return (
          <div className="form-group input-no-icon" key={key}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              type={type}
              value={formData[key]}
              required
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            />
          </div>
        );
      };
      
      
      

    const handleEdit = () => {
        setOriginalData(formData);
        setIsEditing(true);
    };
    
    const cancelEdit = () => {
        setFormData(originalData);
        setIsEditing(false);
    };
    
    const confirmEdit = () => {
        const allFilled = Object.values(formData).every((value) => value.trim() !== "");
        if (!allFilled) {
            alert("אנא מלא את כל השדות");
            return;
        }
        setIsEditing(false);
    };
      

    return (
        <div className="profile-container">
            <div className="profile-title">
                <h1><u>פרופיל</u></h1>
            </div>
            

            {!isEditing && (
                <div className="profile-info">
                    <h2><u>מאפייני המשתמש</u></h2>
                    <table>
                        <tbody>{getUserInfo()}</tbody>
                    </table>
                    <button onClick={handleEdit} className='edit-button'>
                        <FontAwesomeIcon icon={faUserPen} className="profile-icon" />
                        <span className="edit-text">עריכה</span>
                    </button>
                </div>
            )}

            {isEditing && (
                <div className="edit-info">
                    <h2>עריכת מאפייני המשתמש</h2>
                    
                    {renderFormGroup("שם:", "name")}
                    {renderFormGroup("דוא\"ל:", "email", "email")}
                    {renderFormGroup("טלפון:", "phone")}
                    {renderFormGroup("סיסמא:", "password", "password")}

                    <div className="profile-actions">
                        <button onClick={confirmEdit} className='edit-button'>
                            <FontAwesomeIcon icon={faUserPen} className="profile-icon" />
                            <span className="edit-text">עדכון</span>
                        </button>
                        <button onClick={cancelEdit} className='edit-button'>
                            <FontAwesomeIcon icon={faBan} className="profile-icon" />
                            <span className="edit-text">ביטול</span>
                        </button>
                    </div>
                </div>

            )}


        </div>    
    )
}
export default Profile;