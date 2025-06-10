import React from 'react';
// import { ReactComponent as LogoSvg } from '../../assets/pics/logo-1.svg';
import logo from '../../assets/pics/nursing-home_2.svg';
import '../../styles/ForLayout/header.css';

const Logo = ({ color = '#FFFFFF', size = 40 }) => {
    return (
        <div className="logo-container">
            {/* <LogoSvg style={{ fill: color, width: size, height: 'auto' }} /> */}
            <p style={{ color, fontSize: size / 2.5, fontWeight: 'bold' }}>עמותת ותיקי</p>
            <img src={logo} alt="Logo"  style={{ fill: color, width: size, height: 'auto' }}/>
            <p style={{ color, fontSize: size / 2.5, fontWeight: 'bold' }}>מטה יהודה</p>
        </div>
    );
};

export default Logo;
