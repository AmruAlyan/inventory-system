import React, { useState } from "react";
import "../../styles/budget.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShekelSign } from "@fortawesome/free-solid-svg-icons";
import CustomBar from "../../components/CustomBar"; // Assuming you have a BarGraph component
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Budget = () => {
  const [formData, setFormData] = useState({
    current: 0.00,
    latest: { amount: 800.00, date: "2025-01-12" },
    updates: { amount: "", date: "" },
  });

  const handleUpdate = () => {
    const updateAmount = parseFloat(formData.updates.amount);
    const updateDate = formData.updates.date;

    if (!isNaN(updateAmount) && updateDate) {
      setFormData((prev) => ({
        current: prev.current + updateAmount,
        latest: { amount: updateAmount, date: updateDate },
        updates: { amount: "", date: "" },
      }));
    }
  };

  return (
    <div className="budget-container">

        {/* Title */}
        <div className="budget-title"><h1><u>תקציב</u></h1></div>

        {/* Main Content */}
        <div className="main-content">
            {/* Cards Section */}
            <section className="budget-content">
                    {/* Current Budget */}
                <div className="current-budget">
                    <h3>התקציב הנוכחי</h3>
                    <div className="current-budget-value">
                        {formData.current.toFixed(2)}
                        <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    </div>
                </div>

                    {/* Latest Update */}
                <div className="latest-update">
                    <h3>עדכון אחרון</h3>
                    <div className="latest-update-value">
                        {formData.latest.amount.toFixed(2)}
                        <FontAwesomeIcon icon={faShekelSign} className="shekel-icon" />
                    </div>
                    <div className="latest-update-date">
                        {formData.latest.date}
                    </div>
                </div>

                    {/* Update Budget Form */}
                <div className="update-budget">
                    <h3>הגדלת התקציב</h3>
                    <div className="update-budget-form">
                        <div className="form">
                            <label htmlFor="budget-amount">סכום:</label>
                            <input
                                id="budget-amount"
                                type="number"
                                step={0.10}
                                required
                                value={formData.updates.amount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (parseFloat(value) >= 0 || value === "") {
                                    setFormData({
                                        ...formData,
                                        updates: { ...formData.updates, amount: value },
                                    });
                                    }
                                }}
                            />
                        </div>
                        <div className="form">
                            <label htmlFor="budget-date">תאריך:</label>
                            <input
                                id="budget-date"
                                type="date"
                                required
                                min={formData.latest.date}
                                max={new Date().toISOString().split("T")[0]}
                                value={formData.updates.date}
                                onChange={(e) => {
                                    const inputDate = e.target.value;
                                    const minDate = formData.latest.date;
                                    const maxDate = new Date().toISOString().split("T")[0];

                                    if (inputDate < minDate || inputDate > maxDate) {
                                    alert(`Date must be between ${minDate} and ${maxDate}`);
                                    return; // optionally reset the field
                                    }

                                    setFormData({
                                    ...formData,
                                    updates: { ...formData.updates, date: inputDate },
                                    });
                                }}
                            />
                            {/* <DatePicker
                                selected={formData.updates.date ? new Date(formData.updates.date) : null}
                                onChange={(date) =>
                                    setFormData({
                                    ...formData,
                                    updates: {
                                        ...formData.updates,
                                        date: date.toISOString().split("T")[0], // Save as yyyy-mm-dd
                                    },
                                    })
                                }
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date(formData.latest.date)}
                                maxDate={new Date()}
                                placeholderText="בחר תאריך"
                            /> */}
                        </div>

                        <button type="button" className="update-button" onClick={handleUpdate}>
                        עדכן
                        </button>
                    </div>
                </div>

            </section>

            {/* Graph Section */}
            <section className="budget-chart">
                <CustomBar />
            </section>

      </div>
    </div>
  );
};

export default Budget;
