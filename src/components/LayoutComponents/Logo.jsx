import React from 'react';
// import { ReactComponent as LogoSvg } from '../../assets/pics/logo-1.svg';
import logo from '../../assets/pics/nursing-home_2.svg';
import '../../styles/ForLayout/header.css';

const Logo = ({ color = '#FFFFFF', size = 40 }) => {
    const whiteTextStyle = {
        color: '#FFFFFF !important',
        fontSize: size / 3, 
        fontWeight: 'bold',
        margin: 0
    };
    
    return (
        <div className="logo-container">
            {/* <LogoSvg style={{ fill: color, width: size, height: 'auto' }} /> */}
            <p className="logo-text-white" style={whiteTextStyle}>עמותת ותיקי</p>
            <img src={logo} alt="Logo" style={{ filter: 'brightness(0) invert(1)', width: size, height: 'auto' }}/>
            <p className="logo-text-white" style={whiteTextStyle}>מטה יהודה</p>
        </div>
    );
};

export default Logo;
