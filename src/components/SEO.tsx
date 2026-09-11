import React from "react";

interface SEOProps {
  title: string;
  description: string;
  type?: string;
  name?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, type = "website", name = "All Mayadin Bazar" }) => {
  React.useEffect(() => {
    document.title = `${title} | ${name}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    }
  }, [title, description, name]);

  return null;
};
