import { useLocation, useNavigate } from "react-router-dom"; // which page the user is on + redirect him
import { useState, useEffect } from "react"; // for React

// The top bar
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // when URL changes, we check if the user is still logged it
  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, [location]);

  // when the drop down menu is open - if we click outside of it it closes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest("[data-dropdown]")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // login/signup/onboarding - only title
  // dashboard - title + username with drop down menu
  const isDashboard = location.pathname === "/dashboard";
  const isAuthPage = ["/login", "/signup", "/onboarding"].includes(
    location.pathname
  );

  // logout - remove token + username + redirects to login
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setShowDropdown(false);
    navigate("/login");
  };

  // handles the design
  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {isAuthPage ? (
          <h1 style={styles.title}>AI Crypto Advisor</h1>
        ) : (
          <>
            <h1 style={styles.titleLeft}>AI Crypto Advisor</h1>
            {isDashboard && userName && (
              <div style={styles.userSection} data-dropdown>
                <button
                  style={styles.userButton}
                  onClick={() => setShowDropdown(!showDropdown)}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(212, 175, 55, 0.1)";
                    e.target.style.boxShadow =
                      "0 0 15px rgba(212, 175, 55, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {userName}
                  <span style={styles.arrow}>{showDropdown ? "▲" : "▼"}</span>
                </button>
                {showDropdown && (
                  <div style={styles.dropdown}>
                    <button
                      style={styles.dropdownItem}
                      onClick={handleLogout}
                      onMouseEnter={(e) => {
                        e.target.style.background = "rgba(212, 175, 55, 0.2)";
                        e.target.style.color = "#d4af37";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#ffffff";
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

// inline styling of the pages
const styles = {
  navbar: {
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
    borderBottom: "2px solid #d4af37",
    boxShadow: "0 4px 20px rgba(212, 175, 55, 0.3)",
    padding: "16px 24px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#d4af37",
    textAlign: "center",
    flex: 1,
    textShadow: "0 0 10px rgba(212, 175, 55, 0.5)",
    letterSpacing: "1px",
  },
  titleLeft: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#d4af37",
    textShadow: "0 0 10px rgba(212, 175, 55, 0.5)",
    letterSpacing: "1px",
    margin: 0,
  },
  userSection: {
    position: "relative",
  },
  userButton: {
    background: "transparent",
    border: "2px solid #d4af37",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
  },
  arrow: {
    fontSize: "12px",
    color: "#d4af37",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "8px",
    background: "#1a1a1a",
    border: "2px solid #d4af37",
    borderRadius: "8px",
    minWidth: "120px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  dropdownItem: {
    width: "100%",
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s ease",
  },
};
