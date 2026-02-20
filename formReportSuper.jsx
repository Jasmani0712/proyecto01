import React, { useEffect, useState } from "react";
import "../styles/formLayouts.css";
import { Button, Form, Table } from "react-bootstrap";
import { Loader } from "./loader/Loader";
import { generateExcel } from "../services/utils";
import { salesBySellerReport } from "../services/reportServices";
import Cookies from "js-cookie";

export default function FormSalesSeller() {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().slice(0, 10));
  const [hourStart, setHourStart] = useState("");
  const [hourEnd, setHourEnd] = useState("");

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const userData = JSON.parse(Cookies.get("userAuth"));
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const reportData = await salesBySellerReport(
        dateStart,
        dateEnd,
        hourStart == "" ? "00:00" : hourStart,
        hourEnd == "" ? "23:59" : hourEnd,
      );
      console.log("Reporte datas", reportData);
      const sorted = reportData.data.sort((a, b) => {
        if (a.nombreVendedor?.toLowerCase() < b.nombreVendedor?.toLowerCase()) {
          return -1;
        }
        if (a.nombreVendedor?.toLowerCase() > b.nombreVendedor?.toLowerCase()) {
          return 1;
        }
        return 0;
      });
      console.log("Sorted", sorted);
      if (userData.rol == 13) {
        const filtered = sorted.filter((st) => [3, 4].includes(st.rol));
        setReports(filtered);
        setLoading(false);
      } else {
        setReports(sorted);
        setLoading(false);
      }
    } catch (err) {}
  }
  useEffect(() => {
    if (dateStart != dateEnd) {
      setHourStart("");
      setHourEnd("");
    }
  }, [dateStart, dateEnd]);

  const rows = reports.map((report, index) => (
    <tr key={index} className="tableRow">
      <td className="tableColumnSmall">{report.nombreVendedor}</td>
      <td className="tableColumnSmall">{report.totalFacturado}</td>
      <td className="tableColumnSmall">{report.totalAnulado}</td>
      <td className="tableColumnSmall">{report.totalVales}</td>
    </tr>
  ));

  return (
    <section>
      <p className="formLabel">REPORTE SUPERMERCADOS</p>
      <Form
        className="d-flex justify-content-center p-3 flex-column gap-3"
        onSubmit={handleSubmit}
      >
        {/* <Form.Label>Seleccione rango de fechas</Form.Label> */}
        <div className="d-xl-flex justify-content-center gap-3">
          {/* <Form.Group className="flex-grow-1" controlId="dateField1">
            <Form.Label>Fecha Inicio:</Form.Label>
            <Form.Control
              type="date"
              value={dateStart}
              required
              onChange={(e) => setDateStart(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="flex-grow-1" controlId="dateField2">
            <Form.Label>Fecha Fin:</Form.Label>
            <Form.Control
              type="date"
              value={dateEnd}
              required
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </Form.Group> */}
        </div>
        {dateEnd == dateStart ? (
          <div className="d-xl-flex justify-content-center gap-3">
            <Form.Group className="flex-grow-1" controlId="dateField1">
              <Form.Label>Hora Inicio:</Form.Label>
              <Form.Control
                type="time"
                value={hourStart}
                onChange={(e) => setHourStart(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="flex-grow-1" controlId="dateField2">
              <Form.Label>Hora Fin:</Form.Label>
              <Form.Control
                type="time"
                value={hourEnd}
                onChange={(e) => setHourEnd(e.target.value)}
              />
            </Form.Group>
          </div>
        ) : null}

        <div>
          <Button className="flex-grow-1" variant="warning" type="submit">
            Generar Reporte
          </Button>
        </div>
      </Form>

      <div className="d-flex justify-content-center">
        <div className="tableOne">
          <Table striped bordered responsive>
            <thead>
              <tr className="tableHeader">
                <th className="tableColumn">Vendedor</th>
                <th className="tableColumn">Total Facturado</th>
                <th className="tableColumn">Total Anulado</th>
                <th className="tableColumn">Total Vales</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </div>
      </div>
      {reports.length > 0 && (
        <Button
          variant="success"
          onClick={() => {
            generateExcel(
              reports,
              `Reporte de Ventas por vendedor entre: ${dateStart} ${hourStart} - ${dateEnd} ${hourEnd}`,
            );
          }}
        >
          Exportar a excel
        </Button>
      )}
      {loading && <Loader />}
    </section>
  );
}
