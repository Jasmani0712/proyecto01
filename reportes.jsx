import { MenuItem, SubMenu } from "react-pro-sidebar";
import "react-pro-sidebar/dist/css/styles.css";
import React from "react";
import "../../styles/sidebarStyle.scss";
import "../../styles/sidebar.css";
import Image from "react-bootstrap/Image";
import Map from "../../assets/Map.png";
import Report from "../../assets/report.png";
import Truck from "../../assets/truck2.png";
import Log from "../../assets/log2.png";
import Ticket from "../../assets/ticket.png";
import Star from "../../assets/star.png";
import Book from "../../assets/book.png";
import Lines from "../../assets/lines.png";
import Chocolate from "../../assets/chocolate.png";
import Bill from "../../assets/bill.png";
import Gift from "../../assets/Gift.png";
import Salesman from "../../assets/salesman.png";
import Hand from "../../assets/hand.png";
import Prod from "../../assets/prod.png";
import "../../styles/generalStyle.css";
import { MdInventory } from "react-icons/md";
import { TbCalendarTime } from "react-icons/tb";
import { MdMoveUp } from "react-icons/md";
import { BiSolidStoreAlt } from "react-icons/bi";
import { FaBoxes, FaBoxOpen } from "react-icons/fa";
import { TbTransferIn, TbDiscount } from "react-icons/tb";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { BsClockFill } from "react-icons/bs";
import { GrSystem } from "react-icons/gr";
import { MdOutlineSettingsSystemDaydream } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { PiTicketFill } from "react-icons/pi";
import { TbDeviceDesktopStar } from "react-icons/tb";
import { MdGroup } from "react-icons/md";
export default function Reportes({ toggleSub, toggledRep, redirectOnClick }) {
  return (
    <SubMenu
      title="Modulo Reportes"
      onClick={() => {
        toggleSub(5);
      }}
      open={toggledRep}
      icon={<Image src={Report} className="compIcon"></Image>}
    >
      <div className="menuItem">Reportes de ventas</div>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/general")}
        className="menuItem"
      >
        <Image src={Book} className="icon"></Image>Reporte libro de ventas
      </MenuItem>

      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/tiempoReal")}
        className="menuItem"
      >
        <Image src={Book} className="icon"></Image>Reporte libro de ventas
        Tiempo Real
      </MenuItem>

      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/agencias")}
        className="menuItem"
      >
        <BiSolidStoreAlt size="40px" style={{ paddingRight: "5px" }} />
        Reporte de ventas por agencia
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/vendedor")}
        className="menuItem"
      >
        <Image src={Salesman} className="icon"></Image>Reporte de ventas por
        vendedor
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/diario")}
        className="menuItem"
      >
        <Image src={Prod} className="icon"></Image>Reporte mensual de ventas
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/facturas/anuladas")}
        className="menuItem"
      >
        <FaFileInvoiceDollar size="35px" style={{ paddingRight: "5px" }} />
        Reporte de facturas anuladas
      </MenuItem>
      <div className="menuItem">Reportes de productos</div>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/productos")}
        className="menuItem"
      >
        <Image src={Book} className="icon"></Image>Reporte libro de ventas por
        producto
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/agrupado/productos")}
        className="menuItem"
      >
        <Image src={Chocolate} className="icon"></Image>Reporte agrupado de
        productos facturados
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/traspasos/agencia")}
        className="menuItem"
      >
        <Image src={Chocolate} className="icon"></Image>Reporte de prod. en
        traspasos
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/traspasos/productos")}
        className="menuItem"
      >
        <TbTransferIn size="40px" style={{ paddingRight: "5px" }} />
        Reporte de prod. por traspaso
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/vendedor/productos")}
        className="menuItem"
      >
        <Image src={Salesman} className="icon"></Image>Reporte de prod. por
        vendedor
      </MenuItem>
      <div className="menuItem">Reportes de kardex</div>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/actual/kardex")}
        className="menuItem"
      >
        <Image src={Chocolate} className="icon"></Image>Reporte Kardex Actual
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/log/kardex")}
        className="menuItem"
      >
        <TbCalendarTime size="40px" style={{ paddingRight: "5px" }} />
        Reporte Kardex Pasado
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/stock")}
        className="menuItem"
      >
        <MdMoveUp size="40px" style={{ paddingRight: "5px" }} />
        Reporte Movimientos Kardex
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/stock/virtual")}
        className="menuItem"
      >
        <BiSolidStoreAlt size="40px" style={{ paddingRight: "5px" }} />
        Reporte de Stock en Consignación
      </MenuItem>
      <div className="menuItem">Reportes Club Breick</div>
      <MenuItem
        onClick={() => redirectOnClick("/club/reportes/miembros")}
        className="menuItem"
      >
        <MdGroup size="40px" style={{ paddingRight: "5px" }} />
        Miembros Club
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/club/reportes/miembro-breick")}
        className="menuItem"
      >
        <CgProfile size="40px" style={{ paddingRight: "5px" }} />
        Perfil Miembro Breick
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/club/reportes/ticket-promedio")}
        className="menuItem"
      >
        <PiTicketFill size="40px" style={{ paddingRight: "5px" }} />
        Ticket Promedio Miembros
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/club/reportes/top-50-clients")}
        className="menuItem"
      >
        <TbDeviceDesktopStar size="40px" style={{ paddingRight: "5px" }} />
        Top 50 Miembros Breick por Agencia
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/club/reportes/premios_entregados")}
        className="menuItem"
      >
        <FaBoxes size="35px" style={{ paddingRight: "5px" }} />
        Premios Entregados (Por cantidad)
      </MenuItem>

      <div className="menuItem">Otros reportes</div>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/bajas/general")}
        className="menuItem"
      >
        <Image src={Hand} className="icon"></Image>Reporte libro de bajas
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/muestras")}
        className="menuItem"
      >
        <FaBoxOpen size="35px" style={{ paddingRight: "5px" }} />
        Reporte de Muestras, Consignaciones y otros
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/muestras/productos")}
        className="menuItem"
      >
        <FaBoxes size="35px" style={{ paddingRight: "5px" }} />
        Reporte de productos en muestras
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/traspasos/simple")}
        className="menuItem"
      >
        <FaBoxOpen size="35px" style={{ paddingRight: "5px" }} />
        Reporte simple de traspasos
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/descuentos/diarios")}
        className="menuItem"
      >
        <TbDiscount size="35px" style={{ paddingRight: "5px" }} />
        Reporte descuentos por dia
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/pasadas")}
        className="menuItem"
      >
        <BsClockFill size="35px" style={{ paddingRight: "5px" }} />
        Reporte de ventas sist. pasado
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/ventas/crm")}
        className="menuItem"
      >
        <MdOutlineSettingsSystemDaydream
          size="35px"
          style={{ paddingRight: "5px" }}
        />
        Reporte de ventas crm
      </MenuItem>
      <MenuItem
        onClick={() => redirectOnClick("/reportes/pedidos/super")}
        className="menuItem"
      >
        <MdOutlineSettingsSystemDaydream
          size="35px"
          style={{ paddingRight: "5px" }}
        />
        Reporte de Pedidos Supermercados
      </MenuItem>
    </SubMenu>
  );
}
