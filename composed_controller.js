const express = require("express");
const sessionParams = require("../server");
const session = require("express-session");
const {
  createInvoicePos,
  createNotaDebCred,
} = require("../models/invoice_model");
const { registerSalePos } = require("../models/sale_modal");
const {
  updateProductStockPos,
  updateLogStockDetails,
  transactionOfUpdateStocks,
} = require("../models/store_model");
const {
  postFactura: postFacture,
  getEstadoFactura,
  postNotaDebCred,
} = require("../models/emizor_model");
const {
  updateVirtualStock,
  registerOrderPos,
  cancelOrderPos,
} = require("../models/order_model");
const logger = require("../logger-pino");
const { client } = require("../postgressConn");
const {
  createTransferPos,
  acceptTransferPos,
  acceptTransferPosAlt,
} = require("../models/transfer_model");
const { createDropPos } = require("../models/drop_model");
const { logProductEntry } = require("../models/stock_model");
const { logRejectedOrderPos } = require("../models/rejected_model");
const { createInvoiceAltPlus } = require("./invoice_controller_alt");
const { formatError } = require("../services/formatError");

const app = express();

app.use(session(sessionParams));

module.exports = {
  invoiceProcess: (req, res) => {
    console.warn("invoiceProcess:::", req);

    const createdInvoice = createInvoiceAlt(req.body, req);
    createdInvoice
      .then((invoice) => {
        res.status(200).send(invoice);
      })
      .catch((error) => {
        res.status(error.code).send(error);
      });
  },

  recordInvoiceProcess: (req, res) => {
    const createdAndUpdated = recordInvoice(req);
    createdAndUpdated
      .then((invoice) => {
        res.status(200).send(invoice.createdInvoice);
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  },
  onlineInvoiceProcess: (req, res) => {
    const { invoiceBody, saleBody } = req.body;
    const onlineCreated = registerOnlineSale(saleBody, invoiceBody);
    onlineCreated
      .then((invoice) => {
        res.status(200).send(invoice);
      })
      .catch((error) => {
        console.log("ERROR AL REGISTRAR FACTURA DE EN LINEA", error);
        res.status(error.code).send(error);
      });
  },
  composeTransferProcess: (req, res) => {
    const transferCreated = composedTransferProcess(req.body);
    transferCreated
      .then((transfer) => {
        console.log("DATOS DE TRANSFERENCIA EN 59", transfer);
        res.status(200).send(transfer);
      })
      .catch((error) => {
        console.log("Error al crear traspaso en compuesto", error);
        res.status(500).json(error);
      });
  },
  composeDropProcess: (req, res) => {
    const dropCreated = composedDropProcess(req.body);
    dropCreated
      .then((drop) => {
        console.log("DATOS DE LA BAJA EN COMPUESTO", drop);
        res.status(200).send(drop);
      })
      .catch((error) => {
        // const message = error.split("Error");
        console.log("ERROR AL CREAR LA BAJA", error);
        logger.error("composeDropProcess: " + formatError(error));
        res.status(500).send({ data: JSON.stringify(error) });
      });
  },
  composedOrderProcess: (req, res) => {
    const orderCreated = composedOrderProcess(req.body);
    orderCreated
      .then((order) => {
        console.log("DATOS DE ORDEN ", order);
        res.status(200).send(order);
      })
      .catch((error) => {
        console.log("ERROR AL CREAR LA ORDEN", error);
        res.status(500).send(error);
      });
  },
  composedCancelOrderProcess: (req, res) => {
    const orderCanceled = composedCancelOrder(req.body);
    orderCanceled
      .then((order) => {
        console.log("DATOS DE ORDEN ", order);
        res.status(200).send(order);
      })
      .catch((error) => {
        console.log("ERROR AL CANCELAR LA ORDEN", error);
        res.status(500).send(error);
      });
  },
  composedProductEntry: (req, res) => {
    const productEntered = composedProductEntry(req.body);
    productEntered
      .then((order) => {
        console.log("DATOS DE ORDEN ", order);
        res.status(200).send(order);
      })
      .catch((error) => {
        console.log("ERROR AL CANCELAR LA ORDEN", error);
        res.status(500).send(error);
      });
  },
  composedAcceptTramsfer: (req, res) => {
    const accepted = composedAcceptTransfer(req.body);
    accepted
      .then((order) => {
        console.log("DATOS DE ORDEN ", order);
        res.status(200).send(order);
      })
      .catch((error) => {
        console.log("ERROR AL ACEPTAR EL TRASPASO", error);
        res.status(500).send(error);
      });
  },
  /*composedNotaDebCred: (req, res) => {
    console.log(
      "BODY RECIBIDO PARA CREACION DE NOTA DE DEBITO Y CREDITO",
      req.body
    );
    const created = composedNotaCreditoDebito(req.body, req);
    created
      .then((nota) => {
        console.log("DATOS DE LA CREACION ", nota);
        res.status(200).send(nota);
      })
      .catch((error) => {
        //console.log("ERROR AL CREAR NOTA DE DEBITO Y CREDITO", error);
        res.status(500).send(error);
      });
  },*/
  composedNotaCreditoDebito,
};

async function recordInvoice(req) {
  // console.log("Body de la facturacion de estito", req.body);
  try {
    await client.query("BEGIN");
    const updatedVirtual = await updateVirtualStock(req.body);
    const createdInvoice = await createInvoice(req.body, req);
    if (createdInvoice.code == 500) {
      await client.query("ROLLBACK");
      return Promise.reject(createdInvoice);
    }
    const responseObject = {
      createdInvoice,
      updatedVirtual,
    };
    await client.query("COMMIT");
    return responseObject;
  } catch (error) {
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}

const createInvoice = async (body, req) => {
  try {
    // console.log("BODY CREACION FACTURA", body);
    const stockBody = {
      accion: "take",
      idAlmacen: body.stock.idAlmacen,
      productos: body.stock.productos,
      detalle: `NVAG-0`,
      idUsuario: body.venta.pedido.idUsuarioCrea,
    };

    const updatedStock = await updateProductStockPos(stockBody);
    if (updatedStock.code === 200) {
      const idsCreados = updatedStock.data;
      try {
        // TODO? : Create factura
        const invoiceResponse = await postFacture(
          body.emizor,
          body.storeInfo,
          req,
        );
        const data = JSON.parse(invoiceResponse).data.data;
        if (Number(data.emission_type_code) === 1) {
          try {
            const maxRetries = 50;
            let retries = 0;
            let stateData = null;
            const delay = (ms) =>
              new Promise((resolve) => setTimeout(resolve, ms));
            let estadoFactura = null;
            while (retries < maxRetries) {
              try {
                estadoFactura = await getEstadoFactura(req, data.ack_ticket);
                stateData = JSON.parse(estadoFactura).data.data.estado;
              } catch (error) {
                logger.error("createInvoice" + formatError(error));
              }
              retries++;
              await delay(1500); // Delay between retries
              if (stateData === "VALIDA" || stateData === "RECHAZADA") {
                const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;
                if (stateData === "VALIDA") {
                  try {
                    body.invoice.nroFactura = data.numeroFactura;
                    body.invoice.cuf = data.cuf;
                    body.invoice.autorizacion = autorizacion;
                    body.invoice.cufd = data.shortLink;
                    body.invoice.fechaEmision = data.fechaEmision;
                    let invRetries = 0;
                    while (invRetries < maxRetries) {
                      try {
                        const invoiceCreated = await createInvoicePos(
                          body.invoice,
                        );
                        body.venta.idFactura =
                          invoiceCreated.factura.rows[0].idFactura;
                        const maxRetries = 50;
                        let retriesSale = 0;
                        const delay = (ms) =>
                          new Promise((resolve) => setTimeout(resolve, ms));
                        while (retriesSale < maxRetries) {
                          try {
                            const saleCreated = await registerSalePos(
                              body.venta,
                              invoiceCreated.factura.rows[0].idFactura,
                            );
                            const ventaCreada = JSON.parse(saleCreated);
                            try {
                              const updatedLogs = await updateLogStockDetails(
                                `NVAG-${data.numeroFactura}`,
                                idsCreados,
                              );
                              return {
                                code: 200,
                                data: invoiceResponse,
                                id_factura:
                                  invoiceCreated.factura.rows[0].idFactura,
                                leyenda:
                                  JSON.parse(invoiceResponse).leyenda
                                    .descripcion,
                                message: "Factura correcta",
                              };
                            } catch (error) {
                              return {
                                code: 200,
                                data: invoiceResponse,
                                id_factura:
                                  invoiceCreated.factura.rows[0].idFactura,
                                leyenda:
                                  JSON.parse(invoiceResponse).leyenda
                                    .descripcion,
                                message: "Factura correcta",
                              };
                            }
                          } catch (error) {
                            console.log("ERROR CREANDO VENTA", error);
                            if (retriesSale < maxRetries) {
                              retriesSale++;
                              await delay(1000); // Delay between retries
                            } else {
                              return {
                                code: 500,
                                error: error,
                                message: "Error al crear la venta",
                              };
                            }
                          }
                        }
                      } catch (error) {
                        if (invRetries < maxRetries) {
                          invRetries++;
                          await delay(1000); // Delay between retries
                        } else {
                          try {
                            const stockBody = {
                              accion: "add",
                              idAlmacen: body.stock.idAlmacen,
                              productos: body.stock.productos,
                              detalle: `CVAGN-${
                                body.invoice?.nitCliente
                                  ? body.invoice?.nitCliente
                                  : "0"
                              }`,
                              idUsuario: body.venta.pedido.idUsuarioCrea,
                            };
                            const updatedStock =
                              await updateProductStockPos(stockBody);
                            return {
                              code: 500,
                              error: error,
                              message: "Error al crear la factura",
                              updatedStock,
                            };
                          } catch (error) {
                            return {
                              code: 500,
                              error: error,
                              message: "Error al devolver el stock 1",
                            };
                          }
                        }
                      }
                    }
                  } catch (err) {
                    const stockBody = {
                      accion: "add",
                      idAlmacen: body.stock.idAlmacen,
                      productos: body.stock.productos,
                      detalle: `CVAGN-${
                        body.invoice?.nitCliente
                          ? body.invoice?.nitCliente
                          : "0"
                      }`,
                      idUsuario: body.venta.pedido.idUsuarioCrea,
                    };

                    logger.error("createInvoice" + formatError(err));
                    const updatedStock = await updateProductStockPos(stockBody);
                    return {
                      code: 500,
                      error: err,
                      message: "Error en el proceso de facturacion",
                      updatedStock,
                    };
                  }
                } else {
                  try {
                    const stockBody = {
                      accion: "add",
                      idAlmacen: body.stock.idAlmacen,
                      productos: body.stock.productos,
                      detalle: `CVAGN-${
                        body.invoice?.nitCliente
                          ? body.invoice?.nitCliente
                          : "0"
                      }`,
                      idUsuario: body.venta.pedido.idUsuarioCrea,
                    };
                    const updatedStock = await updateProductStockPos(stockBody);
                    return {
                      code: 500,
                      error: estadoFactura,
                      message:
                        JSON.stringify(
                          JSON.parse(estadoFactura)?.data?.data?.errores[0]
                            ?.description,
                        ) + " Factura rechazada, intente nuevamente",
                      updatedStock,
                    };
                  } catch (error) {
                    return {
                      code: 500,
                      error: error,
                      message: "Error al devolver el stock 2",
                    };
                  }
                }
              }
              if (maxRetries === retries) {
                const stockBody = {
                  accion: "add",
                  idAlmacen: body.stock.idAlmacen,
                  productos: body.stock.productos,
                  detalle: `CVAGN-${
                    body.invoice?.nitCliente ? body.invoice?.nitCliente : "0"
                  }`,
                  idUsuario: body.venta.pedido.idUsuarioCrea,
                };
                const updatedStock = await updateProductStockPos(stockBody);
                return {
                  code: 500,
                  error:
                    "Maximo de intentos de validar la factura en impuestos alcanzado",
                  message:
                    "Maximo de intentos de validar la factura en impuestos alcanzado",
                };
              }
            }
          } catch (error) {
            return {
              code: 500,
              error: error,
              message:
                "Error al obtener el estado de la factura, intente encontrala en reimprimir",
            };
          }
        } else {
          logger.warn("Is not online invoice");
          let estadoFactura = "";
          try {
            const maxRetries = 50;
            let retries = 0;
            let stateData = null;
            const delay = (ms) =>
              new Promise((resolve) => setTimeout(resolve, ms));
            while (retries < maxRetries) {
              try {
                estadoFactura = await getEstadoFactura(req, data.ack_ticket);
                stateData = JSON.parse(estadoFactura).data.data.estado;
              } catch (error) {
                logger.error("createInvoice" + formatError(error));
              }
              retries++;
              await delay(1500); // Delay between retries
              if (
                stateData === "VALIDA" ||
                stateData === "RECHAZADA" ||
                stateData === "PENDIENTE"
              ) {
                const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;
                if (stateData === "VALIDA" || stateData === "PENDIENTE") {
                  try {
                    const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;

                    body.invoice.nroFactura = data.numeroFactura;
                    body.invoice.cuf = data.cuf;
                    body.invoice.autorizacion = autorizacion;
                    body.invoice.cufd = data.shortLink;
                    body.invoice.fechaEmision = data.fechaEmision;
                    let invRetries = 0;
                    while (invRetries < maxRetries) {
                      try {
                        const invoiceCreated = await createInvoicePos(
                          body.invoice,
                        );
                        body.venta.idFactura =
                          invoiceCreated.factura.rows[0].idFactura;
                        let salesRetries = 0;
                        while (salesRetries < maxRetries) {
                          try {
                            const saleCreated = await registerSalePos(
                              body.venta,
                              invoiceCreated.factura.rows[0].idFactura,
                            );
                            const ventaCreada = JSON.parse(saleCreated);

                            try {
                              const updatedLogs = await updateLogStockDetails(
                                `NVAG-${data.numeroFactura}`,
                                idsCreados,
                              );
                              return {
                                code: 200,
                                data: invoiceResponse,
                                id_factura:
                                  invoiceCreated.factura.rows[0].idFactura,
                                leyenda:
                                  JSON.parse(invoiceResponse).leyenda
                                    .descripcion,
                                message: "Factura correcta",
                              };
                            } catch (error) {
                              return {
                                code: 500,
                                error: error,
                                message: "Error al actualizar los logs",
                              };
                            }
                          } catch (error) {
                            console.log("ERROR CREANDO VENTA", error);
                            if (salesRetries < maxRetries) {
                              salesRetries++;
                              await delay(1000); // Delay between retries
                            } else {
                              return {
                                code: 500,
                                error: error,
                                message: "Error al crear la venta",
                              };
                            }
                          }
                        }
                      } catch (error) {
                        logger.error("createInvoice" + formatError(error));
                        if (invRetries < maxRetries) {
                          invRetries++;
                          logger.warn(`
                            Retrying invoice creation,
                            ${invRetries}
                          `);
                          await delay(1000); // Delay between retries
                        } else {
                          try {
                            const stockBody = {
                              accion: "add",
                              idAlmacen: body.stock.idAlmacen,
                              productos: body.stock.productos,
                              detalle: `CVAGN-${
                                body.invoice?.nitCliente
                                  ? body.invoice?.nitCliente
                                  : "0"
                              }`,
                              idUsuario: body.venta.pedido.idUsuarioCrea,
                            };
                            const updatedStock =
                              await updateProductStockPos(stockBody);
                            return {
                              code: 500,
                              error: error,
                              message: "Error al crear la factura",
                            };
                          } catch (error) {
                            return {
                              code: 500,
                              error: error,
                              message: "Error al devolver el stock 3",
                            };
                          }
                        }
                      }
                    }
                  } catch (err) {
                    return {
                      code: 500,
                      error: err,
                      message: "Error en el proceso de facturacion",
                    };
                  }
                } else {
                  try {
                    const stockBody = {
                      accion: "add",
                      idAlmacen: body.stock.idAlmacen,
                      productos: body.stock.productos,
                      detalle: `CVAGN-${
                        body.invoice?.nitCliente
                          ? body.invoice?.nitCliente
                          : "0"
                      }`,
                      idUsuario: body.venta.pedido.idUsuarioCrea,
                    };
                    const updatedStock = await updateProductStockPos(stockBody);
                    return {
                      code: 500,
                      error: stateData,
                      message:
                        JSON.stringify(
                          JSON.parse(estadoFactura)?.data?.data?.errores[0]
                            ?.description,
                        ) + " Factura rechazada, intente nuevamente",
                    };
                  } catch (error) {
                    return {
                      code: 500,
                      error: error,
                      message: "Error al devolver el stock 4",
                    };
                  }
                }
              }
              if (maxRetries === retries) {
                return {
                  code: 500,
                  error: "Maximo de intentos alcanzado",
                  message: "Maximo de intentos alcanzado",
                };
              }
            }
          } catch (error) {
            return {
              code: 500,
              error: error,
              message: "Error al obtener el estado de la factura",
            };
          }
        }
      } catch (error) {
        logger.error("createInvoice" + formatError(error));
        console.log("ERROR AL ENVIAR FACTURA", error);
        // TODO? : ERROR at create factura
        try {
          const stockBody = {
            accion: "add",
            idAlmacen: body.stock.idAlmacen,
            productos: body.stock.productos,
            detalle: `CVAGN-${
              body.invoice?.nitCliente ? body.invoice?.nitCliente : "0"
            }`,
            idUsuario: body.venta.pedido.idUsuarioCrea,
          };

          const updatedStock = await updateProductStockPos(stockBody);
          logger.error("createInvoice" + formatError(updatedStock.error));
          return {
            code: JSON.parse(error).status,
            error: error,
            message: "Error al enviar la factura a emizor",
          };
        } catch (error) {
          console.log("ERROR DE EMIZOR", error);
          logger.error("createInvoice" + formatError(error));
          return {
            code: 500,
            error: error,
            message: "Error al devolver el stock 5",
          };
        }
      }
    } else {
      logger.error("createInvoice" + formatError(updatedStock.error));
      console.log("ERROR", updatedStock);
      return {
        code: 500,
        error: updatedStock,
        message:
          "Error al actualizar stock, algún producto no cuenta con la cantidad solicitada 1 ",
      };
    }
  } catch (error) {
    logger.error("createInvoice" + formatError(error));
    return {
      code: 500,
      error: error,
      message:
        "Error al actualizar stock, algún producto no cuenta con la cantidad solicitada 2",
    };
  }
};

const createInvoiceAlt = async (body, req) => {
  console.log("createInvoiceAlt::", body);
  try {
    const stockBody = {
      accion: "take",
      idAlmacen: body.stock.idAlmacen,
      productos: body.stock.productos,
      detalle: `NVAG-${body.invoice?.nitCliente || 0}`,
      idUsuario: body.venta.pedido.idUsuarioCrea,
    };
    console.log("Stock body:", stockBody);
    // TODO? : Update stock
    const updatedStock = await updateProductStockPos(stockBody);
    if (updatedStock.code === 200) {
      console.log("Resultado de creacion de logs", updatedStock);
      const idsCreados = updatedStock.data;
      try {
        // TODO? : Create factura
        console.log("Body de la factura", body);
        const invoiceResponse = await postFacture(
          body.emizor,
          body.storeInfo,
          req,
        );
        const data = JSON.parse(invoiceResponse).data.data;
        if (Number(data.emission_type_code) === 1) {
          try {
            const maxRetries = 25;
            let retries = 0;
            let stateData = null;
            const delay = (ms) =>
              new Promise((resolve) => setTimeout(resolve, ms));
            let estadoFactura = null;
            while (retries < maxRetries) {
              try {
                estadoFactura = await getEstadoFactura(req, data.ack_ticket);
                console.log("ESTADO DE LA FACTURA", estadoFactura);
                stateData = JSON.parse(estadoFactura).data.data.estado;
              } catch (error) {
                console.log("Error", error);
                console.log("Numero de intento", retries);
                logger.error("CreateInvoiceAlt: " + formatError(error));
                /* return {
                  code: 500,
                  error: error,
                  message:
                    "Error al obtener el estado de la factura, espere un momento e intente reimprimir",
                };*/
              }
              retries++;
              await delay(1500); // Delay between retries
              if (stateData === "VALIDA" || stateData === "RECHAZADA") {
                const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;
                console.log("Autorizacion test", autorizacion);
                if (stateData === "VALIDA") {
                  try {
                    console.log("Resp de la factura", data);
                    body.invoice.nroFactura = data.numeroFactura;
                    body.invoice.cuf = data.cuf;
                    body.invoice.autorizacion = autorizacion;
                    body.invoice.cufd = data.shortLink;
                    body.invoice.fechaEmision = data.fechaEmision;
                    let invRetries = 0;
                    try {
                      while (invRetries < maxRetries) {
                        const invoiceCreated = await createInvoicePos(
                          body.invoice,
                        );
                        console.log(
                          "Invoice created",
                          invoiceCreated.factura.rows[0].idFactura,
                        );
                        body.venta.idFactura =
                          invoiceCreated.factura.rows[0].idFactura;
                        const maxRetries = 25;
                        let retriesSale = 0;
                        const delay = (ms) =>
                          new Promise((resolve) => setTimeout(resolve, ms));
                        while (retriesSale < maxRetries) {
                          try {
                            const saleCreated = await registerSalePos(
                              body.venta,
                              invoiceCreated.factura.rows[0].idFactura,
                            );
                            const ventaCreada = JSON.parse(saleCreated);
                            console.log("Sale created", ventaCreada);
                            try {
                              const updatedLogs = await updateLogStockDetails(
                                `NVAG-${data.numeroFactura}`,
                                idsCreados,
                              );
                              console.log("Updated logs", updatedLogs);
                              console.log("Invoice response", invoiceResponse);
                              console.log("retries", retriesSale);
                              return {
                                code: 200,
                                data: invoiceResponse,
                                id_factura:
                                  invoiceCreated.factura.rows[0].idFactura,
                                leyenda:
                                  JSON.parse(invoiceResponse).leyenda
                                    .descripcion,
                                message: "Factura correcta",
                              };
                            } catch (error) {
                              console.log("Error", error);
                              logger.error(
                                "createInvoiceAlt: " + formatError(error),
                              );
                              return {
                                code: 200,
                                data: invoiceResponse,
                                id_factura:
                                  invoiceCreated.factura.rows[0].idFactura,
                                leyenda:
                                  JSON.parse(invoiceResponse).leyenda
                                    .descripcion,
                                message: "Factura correcta",
                              };
                            }
                          } catch (error) {
                            logger.error(
                              "createInvoiceAlt: " + formatError(error),
                            );
                            if (retriesSale < maxRetries) {
                              retriesSale++;
                              console.log("Retrying sale creation", retries);
                              console.log("ERROR CREANDO VENTA", error);
                              await delay(1500); // Delay between retries
                            } else {
                              console.log("Error", error);
                              return {
                                code: 500,
                                error: error,
                                message: "Error al crear la venta",
                              };
                            }
                          }
                        }
                      }
                    } catch (error) {
                      logger.error("createInvoiceAlt: " + formatError(error));
                      if (invRetries < maxRetries) {
                        invRetries++;
                        console.log("Retrying sale creation", invRetries);
                        console.log("ERROR CREANDO VENTA", error);
                        await delay(1500); // Delay between retries
                      } else {
                        try {
                          console.log("Error", error);
                          const stockBody = {
                            accion: "add",
                            idAlmacen: body.stock.idAlmacen,
                            productos: body.stock.productos,
                            detalle: `CVAGN-${
                              body.invoice?.nitCliente
                                ? body.invoice?.nitCliente
                                : "0"
                            }`,
                            idUsuario: body.venta.pedido.idUsuarioCrea,
                          };
                          console.log("Stock body", stockBody);
                          const updatedStock =
                            await updateProductStockPos(stockBody);
                          return {
                            code: 500,
                            error: error,
                            message: "Error al crear la factura",
                            updatedStock,
                          };
                        } catch (error) {
                          console.log("Error", error);
                          logger.error(
                            "createInvoiceAlt: " + formatError(error),
                          );

                          return {
                            code: 500,
                            error: error,
                            message: "Error al devolver el stock 6",
                          };
                        }
                      }
                    }
                  } catch (err) {
                    logger.error("CreateInvoiceAlt: " + formatError(err));
                    const stockBody = {
                      accion: "add",
                      idAlmacen: body.stock.idAlmacen,
                      productos: body.stock.productos,
                      detalle: `CVAGN-${
                        body.invoice?.nitCliente
                          ? body.invoice?.nitCliente
                          : "0"
                      }`,
                      idUsuario: body.venta.pedido.idUsuarioCrea,
                    };
                    console.log("Stock body", stockBody);
                    const updatedStock = await updateProductStockPos(stockBody);
                    return {
                      code: 500,
                      error: err,
                      message: "Error en el proceso de facturacion",
                      updatedStock,
                    };
                  }
                } else {
                  try {
                    const stockBody = {
                      accion: "add",
                      idAlmacen: body.stock.idAlmacen,
                      productos: body.stock.productos,
                      detalle: `CVAGN-${
                        body.invoice?.nitCliente
                          ? body.invoice?.nitCliente
                          : "0"
                      }`,
                      idUsuario: body.venta.pedido.idUsuarioCrea,
                    };
                    console.log("Stock body", stockBody);
                    const updatedStock = await updateProductStockPos(stockBody);
                    return {
                      code: 500,
                      error: estadoFactura,
                      message:
                        JSON.stringify(
                          JSON.parse(estadoFactura)?.data?.data?.errores[0]
                            ?.description,
                        ) + " Factura rechazada, intente nuevamente",
                      updatedStock,
                    };
                  } catch (error) {
                    logger.error("CreateInvoiceAlt: " + formatError(error));

                    return {
                      code: 500,
                      error: error,
                      message: "Error al devolver el stock 7",
                    };
                  }
                }
              }
              if (maxRetries === retries) {
                const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;
                console.log("Resp de la factura", data);
                body.invoice.nroFactura = data.numeroFactura;
                body.invoice.cuf = data.cuf;
                body.invoice.autorizacion = autorizacion;
                body.invoice.cufd = data.shortLink;
                body.invoice.fechaEmision = data.fechaEmision;
                const invoiceCreated = await createInvoicePos(body.invoice);
                console.log(
                  "Invoice created",
                  invoiceCreated.factura.rows[0].idFactura,
                );
                body.venta.idFactura = invoiceCreated.factura.rows[0].idFactura;

                try {
                  const saleCreated = await registerSalePos(
                    body.venta,
                    invoiceCreated.factura.rows[0].idFactura,
                  );
                  const ventaCreada = JSON.parse(saleCreated);
                  console.log("Sale created", ventaCreada);
                  try {
                    const updatedLogs = await updateLogStockDetails(
                      `NVAG-${data.numeroFactura}`,
                      idsCreados,
                    );
                    console.log("Updated logs", updatedLogs);
                    console.log("Invoice response", invoiceResponse);
                    return {
                      code: 200,
                      data: invoiceResponse,
                      id_factura: invoiceCreated.factura.rows[0].idFactura,
                      leyenda: JSON.parse(invoiceResponse).leyenda.descripcion,
                      message: "Factura correcta",
                    };
                  } catch (error) {
                    console.log("Error", error);
                    logger.error("createInvoiceAlt: " + formatError(error));
                    return {
                      code: 200,
                      data: invoiceResponse,
                      id_factura: invoiceCreated.factura.rows[0].idFactura,
                      leyenda: JSON.parse(invoiceResponse).leyenda.descripcion,
                      message: "Factura correcta",
                    };
                  }
                } catch (error) {
                  logger.error("createInvoiceAlt: " + formatError(error));
                }
                logger.error(
                  "CreateInvoiceAlt: " +
                    formatError(
                      "Maximo de intentos de validar la factura en impuestos alcanzado",
                    ),
                );

                return {
                  code: 500,
                  error:
                    "Maximo de intentos de validar la factura en impuestos alcanzado",
                  message:
                    "Maximo de intentos de validar la factura en impuestos alcanzado",
                };
              }
            }
          } catch (error) {
            logger.error("CreateInvoiceAlt: " + formatError(error));

            return {
              code: 500,
              error: error,
              message:
                "Error al obtener el estado de la factura, intente encontrala en reimprimir",
            };
          }
        } else {
          console.log("Is not online invoice");
          let estadoFactura = "";
          try {
            const maxRetries = 25;
            let retries = 0;
            let stateData = null;
            const delay = (ms) =>
              new Promise((resolve) => setTimeout(resolve, ms));
            while (retries < maxRetries) {
              try {
                estadoFactura = await getEstadoFactura(req, data.ack_ticket);
                console.log(
                  "Estado de la factura no emmision type",
                  estadoFactura,
                );
                stateData = JSON.parse(estadoFactura).data.data.estado;
              } catch (error) {
                logger.error("CreateInvoiceAlt: " + formatError(error));

                console.log("Error", error);
                /*return {
                  code: 500,
                  error: error,
                  message: "Error al obtener el estado de la factura",
                };*/
              }
              retries++;
              await delay(1500); // Delay between retries
              if (
                stateData === "VALIDA" ||
                stateData === "RECHAZADA" ||
                stateData === "PENDIENTE"
              ) {
                const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;
                console.log("Autorizacion test", autorizacion);
                if (stateData === "VALIDA" || stateData === "PENDIENTE") {
                  try {
                    const autorizacion = `${body.emizor.extras.facturaTicket}$${data.ack_ticket}`;
                    console.log("Autorizacion test", autorizacion);
                    console.log("Resp de la factura", data);
                    body.invoice.nroFactura = data.numeroFactura;
                    body.invoice.cuf = data.cuf;
                    body.invoice.autorizacion = autorizacion;
                    body.invoice.cufd = data.shortLink;
                    body.invoice.fechaEmision = data.fechaEmision;
                    try {
                      const invoiceCreated = await createInvoicePos(
                        body.invoice,
                      );
                      console.log(
                        "Invoice created",
                        invoiceCreated.factura.rows[0].idFactura,
                      );
                      body.venta.idFactura =
                        invoiceCreated.factura.rows[0].idFactura;
                      try {
                        const saleCreated = await registerSalePos(
                          body.venta,
                          invoiceCreated.factura.rows[0].idFactura,
                        );
                        const ventaCreada = JSON.parse(saleCreated);
                        console.log("Sale created", ventaCreada);
                        try {
                          const updatedLogs = await updateLogStockDetails(
                            `NVAG-${data.numeroFactura}`,
                            idsCreados,
                          );
                          return {
                            code: 200,
                            data: invoiceResponse,
                            id_factura:
                              invoiceCreated.factura.rows[0].idFactura,
                            leyenda:
                              JSON.parse(invoiceResponse).leyenda.descripcion,
                            message: "Factura correcta",
                          };
                        } catch (error) {
                          return {
                            code: 500,
                            error: error,
                            message: "Error al actualizar los logs",
                          };
                        }
                      } catch {
                        return {
                          code: 500,
                          error: error,
                          message: "Error al crear la venta",
                        };
                      }
                    } catch (error) {
                      logger.error("CreateInvoiceAlt: " + formatError(error));

                      try {
                        const stockBody = {
                          accion: "add",
                          idAlmacen: body.stock.idAlmacen,
                          productos: body.stock.productos,
                          detalle: `CVAGN-${
                            body.invoice?.nitCliente
                              ? body.invoice?.nitCliente
                              : "0"
                          }`,
                          idUsuario: body.venta.pedido.idUsuarioCrea,
                        };
                        console.log("Stock body", stockBody);
                        const updatedStock =
                          await updateProductStockPos(stockBody);
                        return {
                          code: 500,
                          error: error,
                          message: "Error al crear la factura",
                        };
                      } catch (error) {
                        logger.error("CreateInvoiceAlt: " + formatError(error));

                        return {
                          code: 500,
                          error: error,
                          message: "Error al devolver el stock 8",
                        };
                      }
                    }
                  } catch (err) {
                    logger.error("CreateInvoiceAlt: " + formatError(err));

                    return {
                      code: 500,
                      error: err,
                      message: "Error en el proceso de facturacion",
                    };
                  }
                } else {
                  try {
                    const stockBody = {
                      accion: "add",
                      idAlmacen: body.stock.idAlmacen,
                      productos: body.stock.productos,
                      detalle: `CVAGN-${
                        body.invoice?.nitCliente
                          ? body.invoice?.nitCliente
                          : "0"
                      }`,
                      idUsuario: body.venta.pedido.idUsuarioCrea,
                    };
                    console.log("Stock body", stockBody);
                    const updatedStock = await updateProductStockPos(stockBody);
                    console.log("update Stock", updatedStock);
                    console.log("Resp de la factura", data);

                    console.log("estado factura", JSON.parse(estadoFactura));
                    return {
                      code: 500,
                      error: stateData,
                      message:
                        JSON.stringify(
                          JSON.parse(estadoFactura)?.data?.data?.errores[0]
                            ?.description,
                        ) + " Factura rechazada, intente nuevamente",
                    };
                  } catch (error) {
                    logger.error("CreateInvoiceAlt: " + formatError(error));

                    return {
                      code: 500,
                      error: error,
                      message: "Error al devolver el stock 9",
                    };
                  }
                }
              }
              if (maxRetries === retries) {
                const stockBody = {
                  accion: "add",
                  idAlmacen: body.stock.idAlmacen,
                  productos: body.stock.productos,
                  detalle: `CVAGN-${
                    body.invoice?.nitCliente ? body.invoice?.nitCliente : "0"
                  }`,
                  idUsuario: body.venta.pedido.idUsuarioCrea,
                };
                console.log("Stock body", stockBody);
                const updatedStock = await updateProductStockPos(stockBody);
                logger.error(
                  "CreateInvoiceAlt: " +
                    formatError(
                      "Maximo de intentos de validar la factura en impuestos alcanzado",
                    ),
                );
                return {
                  code: 500,
                  error:
                    "Maximo de intentos de validar la factura en impuestos alcanzado, intente nuevamente",
                  message:
                    "Maximo de intentos de validar la factura en impuestos alcanzado, intente nuevamente",
                };
              }
            }
          } catch (error) {
            logger.error("CreateInvoiceAlt: " + formatError(error));

            return {
              code: 500,
              error: error,
              message: "Error al obtener el estado de la factura",
            };
          }
        }
      } catch (error) {
        console.log("Error", error);
        // TODO? : ERROR at create factura
        try {
          const stockBody = {
            accion: "add",
            idAlmacen: body.stock.idAlmacen,
            productos: body.stock.productos,
            detalle: `CVAGN-${
              body.invoice?.nitCliente ? body.invoice?.nitCliente : "0"
            }`,
            idUsuario: body.venta.pedido.idUsuarioCrea,
          };
          console.log("Stock body", stockBody);
          const updatedStock = await updateProductStockPos(stockBody);
          logger.error("createInvoiceAlt: " + formatError(error));
          return {
            code: JSON.parse(error).status,
            error: error,
            message: "Error al enviar la factura a emizor",
          };
        } catch (error) {
          logger.error("createInvoiceAlt: " + formatError(error));

          return {
            code: 500,
            error: error,
            message: "Error al devolver el stock 10",
          };
        }
      }
    } else {
      logger.error("createInvoiceliceAlt: " + formatError(updatedStock.error));

      return {
        code: 500,
        error: updatedStock,
        message:
          "Error al actualizar stock, algún producto no cuenta con la cantidad solicitada 1 ",
      };
    }
  } catch (error) {
    console.log("Error", error);
    logger.error("createInvoiceAlt: " + formatError(error));

    return {
      code: 500,
      error: error,
      message:
        "Error al actualizar stock, algún producto no cuenta con la cantidad solicitada 2",
    };
  }
};

async function registerOnlineSale(saleBody, invoiceBody) {
  try {
    const invoiceCreated = await createInvoicePos(invoiceBody);
    body.venta.idFactura = invoiceCreated.factura.rows[0].idFactura;
    try {
      const saleCreated = await registerSalePos(
        saleBody,
        invoiceCreated.factura.rows[0].idFactura,
      );
      const ventaCreada = JSON.parse(saleCreated);
      return {
        code: 200,
        data: { invoiceCreated, ventaCreada },
        message: "Factura correcta",
      };
    } catch {
      return {
        code: 500,
        error: error,
        message: "Error al crear la venta",
      };
    }
  } catch (error) {
    return {
      code: 500,
      error: error,
      message: "Error al crear la factura",
    };
  }
}

async function composedTransferProcess(body) {
  console.log("ENTRA ACA EN EL NUEVO PROCESO", body.stock);
  const objStock = body.stock;
  return new Promise(async (resolve, reject) => {
    try {
      await client.query("BEGIN");
      const transferCreated = await createTransferPos(body.traspaso);
      console.log("TRANSFER CREATED", JSON.parse(transferCreated));
      const idCreado = JSON.parse(transferCreated).data.idCreado;
      console.log("ID CREADO", idCreado);
      const stockBody = {
        accion: objStock.accion,
        idAlmacen: objStock.idAlmacen,
        productos: objStock.productos,
        detalle: `SSNTR-${idCreado}`,
        idUsuario: body.traspaso.idUsuario,
      };
      const updatedStock = await updateProductStockPos(stockBody, true);

      console.log("Traspaso AKI", updatedStock);
      if (updatedStock.code == 200) {
        console.log("Devolviendo esto", idCreado);
        await client.query("COMMIT");
        resolve({ data: { idCreado } });
      } else {
        console.log("Error al crear por stock", JSON.stringify(updatedStock));
        await client.query("ROLLBACK");
        reject(updatedStock);
      }
    } catch (error) {
      console.log("HAY UN ERROR EN EL TRASPASO", error);
      await client.query("ROLLBACK");
      reject(error);
    }
  });
}

async function composedDropProcess(body) {
  const objStock = body.stock;
  try {
    await client.query("BEGIN");
    const dropCreated = await createDropPos(body.baja);
    console.log("BAJA CREADA", dropCreated);
    const idCreado = dropCreated.id;
    const stockBody = {
      accion: objStock.accion,
      idAlmacen: objStock.idAlmacen,
      productos: objStock.productos,
      detalle: `SPRBJ-${idCreado}`,
      idUsuario: body.baja.idUsuario,
    };
    const updatedStock = await updateProductStockPos(stockBody, true);
    if (updatedStock.code == 200) {
      console.log("Devolviendo esto", idCreado);
      await client.query("COMMIT");
      return { idCreado };
    } else {
      logger.error("composedDropProcess: " + formatError(updatedStock.error));
      console.log("Updated stock error", updatedStock?.error);
      await client.query("ROLLBACK");
      return Promise.reject(updatedStock.error);
    }
  } catch (error) {
    const message = await error;
    logger.error("composedDropProcess: " + formatError(message ?? ""));
    console.log("HAY UN ERROR EN LA BAJA", message);
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}

async function composedOrderProcess(body) {
  console.log("ENTRA ACA EN EL NUEVO PROCESO", body);
  const { objOrder, userStore, clienteIssuper } = body;
  try {
    await client.query("BEGIN");
    const regiteredOrder = await registerOrderPos(objOrder, userStore);
    console.log("TRANSFER CREATED", JSON.parse(regiteredOrder));
    const idCreado = JSON.parse(regiteredOrder).data.idCreado;
    console.log("ID CREADO", idCreado);
    const stockBody = {
      accion: "take",
      idAlmacen: userStore,
      productos: objOrder.productos,
      detalle: `SPNPD-${idCreado}`,
      idUsuario: objOrder.pedido.idUsuarioCrea,
    };
    const updatedStock = await updateProductStockPos(
      stockBody,
      true,
      clienteIssuper,
    );

    console.log("Traspaso AKI", updatedStock, updatedStock.code);
    if (updatedStock.code == 200) {
      console.log("Devolviendo esto", idCreado);
      await client.query("COMMIT");
      return { idCreado };
    } else {
      console.log("Error al crear por stock", JSON.stringify(updatedStock));
      await client.query("ROLLBACK");
      return Promise.reject(updatedStock.error);
    }
  } catch (error) {
    console.log("HAY UN ERROR EN EL ORDER", error);
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}

async function composedCancelOrder(body) {
  console.log("ENTRO AL COMPUESTO");
  const { stock, order } = body;
  try {
    await client.query("BEGIN");
    const updatedStock = await updateProductStockPos(stock, true);
    if (updatedStock.code == 200) {
      console.log("Stock updateado", updatedStock);
      const orderCanceled = await cancelOrderPos(order);
      await client.query("COMMIT");
      return orderCanceled;
    } else {
      await client.query("ROLLBACK");
      return Promise.reject(updatedStock);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}

async function composedProductEntry(body) {
  console.log("ENTRO AL COMPUESTO");
  const { log, stock } = body;
  try {
    await client.query("BEGIN");
    const logged = await logProductEntry(log);
    const createdId = logged.id;
    const stockBody = {
      accion: stock.accion,
      idAlmacen: stock.idAlmacen,
      productos: stock.productos,
      detalle: log.tipo == "I" ? `NIDPR-${createdId}` : `NDDPR-${createdId}`,
      idUsuario: log.idUsuarioCrea,
    };
    const updated = await updateProductStockPos(stockBody, true);
    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}

async function composedAcceptTransfer(body) {
  console.log("Entrando al compuesto", body);
  const { stock, transfer, condition, logRejected } = body;
  try {
    await client.query("BEGIN");
    if (condition) {
      console.log("ENTRO A LOGGEAR RECHAZO");
      await logRejectedOrderPos(logRejected);
    }
    const updated = await transactionOfUpdateStocks(stock, true);
    console.log("Actualizo los stocks", updated);
    if (updated.code == 200) {
      const accepted = await acceptTransferPosAlt({
        id: transfer.id,
        userId: transfer.userId,
      });
      await client.query("COMMIT");
      return accepted;
    } else {
      await client.query("ROLLBACK");
      return Promise.reject(updated);
    }
  } catch (error) {
    console.log("ERROR", error);
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}

async function composedNotaCreditoDebito(body, req) {
  //console.log("Entrando al compuesto", body);
  const { stockBody, emizorBody, idSucursal, idFactura, isStock } = body;
  try {
    await client.query("BEGIN");
    const updated = await transactionOfUpdateStocks(
      isStock ? [stockBody] : [],
      true,
    );

    //console.log("FLAG 2 STOCKS", updated);
    if (updated.code == 200) {
      console.log("EMIZOR BODY", emizorBody);
      const emizor = await postNotaDebCred(emizorBody, req, idFactura);
      console.log("Creada nota de debito y credito", emizor);
      const notadebcred = await createNotaDebCred(
        idFactura,
        stockBody.productos,
      );
      await client.query("COMMIT");
      return { notadebcred, emizor: JSON.parse(emizor).data.data };
    } else {
      await client.query("ROLLBACK");
      return Promise.reject(updated);
    }
  } catch (error) {
    console.log("ERROR EN EL CATCH", error);
    await client.query("ROLLBACK");
    return Promise.reject(error);
  }
}
