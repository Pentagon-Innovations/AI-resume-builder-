import React from 'react';
import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import CreativeTemplate from './CreativeTemplate';

const TemplateEngine = ({ templateName, data }) => {
    switch (templateName) {
        case 'modern':
            return <ModernTemplate data={data} />;
        case 'classic':
            return <ClassicTemplate data={data} />;
        case 'creative':
            return <CreativeTemplate data={data} />;
        default:
            return <ModernTemplate data={data} />;
    }
};

export default TemplateEngine;
