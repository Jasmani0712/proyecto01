import React from "react";
import Display from "./display";
import FormNewOrder from "./formNewOrder";
import FormReportSuper from "./formReportSuper";

import Sidebar from "./sidebar";
import "../styles/generalStyle.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
export default function NewOrder() {
  const navigate = useNavigate();
  useEffect(() => {
    const user = Cookies.get("userAuth");
    if (user) {
      if (
        JSON.parse(Cookies.get("userAuth")).rol <= 10 ||
        JSON.parse(Cookies.get("userAuth")).rol == 13 ||
        (JSON.parse(Cookies.get("userAuth")).rol == 10 &&
          JSON.parse(Cookies.get("userAuth")).idDepto != 1)
      ) {
      } else {
        navigate("/principal");
      }
    }
  }, []);
  return (
    <div>
      <div className="userBar">
        <div></div>
        <Display />
      </div>
      <div className="form">
        <div className="sidebarDisplay">
          <Sidebar />
        </div>
        <div className="formDisplay">
          <FormReportSuper />
        </div>
      </div>
    </div>
  );
}
