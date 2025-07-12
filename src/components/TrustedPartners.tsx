import React from 'react';

const TrustedPartners = () => {
  const partners = [
    { 
      name: "Madurai Kamaraj University", 
      logo: "MKU",
      image: "https://raw.githubusercontent.com/softskillmam/kiki-learn-grow-21/main/public/lovable-uploads/aab35988-5b49-4486-86d5-cc8a330fd4c9.png",
      description: "Leading University in Tamil Nadu"
    },
    { 
      name: "Kalasalingam University", 
      logo: "KLU",
      image: "https://raw.githubusercontent.com/softskillmam/kiki-learn-grow-21/main/public/lovable-uploads/1df6daed-3cf6-49c0-8c46-e7a79c003165.png",
      description: "Excellence in Engineering & Technology"
    },
    { 
      name: "Tamil Nadu Skill Development", 
      logo: "TNSD",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop&crop=center",
      description: "Government Skills Initiative"
    },
    { 
      name: "Madurai IT Association", 
      logo: "MITA",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&crop=center",
      description: "Technology Partners"
    },
    { 
      name: "Career Guidance Council", 
      logo: "CGC",
      image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=400&h=300&fit=crop&crop=center",
      description: "Career Development Board"
    },
    { 
      name: "Youth Development Board", 
      logo: "YDB",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center",
      description: "Youth Empowerment Agency"
    },
    { 
      name: "Madurai Chamber", 
      logo: "MCC",
      image: "https://raw.githubusercontent.com/softskillmam/kiki-learn-grow-21/main/public/lovable-uploads/eea1d960-780b-4db1-89ab-648014f584d0.png",
      description: "Business Development Council"
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-b">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Trusted by Leading Organizations in Tamil Nadu
          </h2>
          <p className="text-gray-600 mb-2">
            We partner with premier institutions in Madurai and across Tamil Nadu
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-kiki-purple-600">
            <span>📍</span>
            <span>Madurai, Tamil Nadu, India</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
            >
              {/* Background Image */}
              <div className="aspect-[4/3] relative">
                <img 
                  src={partner.image} 
                  alt={partner.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </div>
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  {/* Logo Badge */}
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-kiki-purple-500 to-kiki-blue-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {partner.logo}
                    </span>
                  </div>
                  
                  {/* Partner Info */}
                  <h3 className="text-sm font-bold text-gray-900 text-center mb-1">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-gray-600 text-center">
                    {partner.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-kiki-purple-50 rounded-full">
            <span className="text-sm font-medium text-kiki-purple-700">
              Soft Skills & Career Development Focus
            </span>
            <span className="w-1 h-1 bg-kiki-purple-400 rounded-full"></span>
            <span className="text-sm text-kiki-purple-600">
              Contact: 8220879805
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedPartners;
