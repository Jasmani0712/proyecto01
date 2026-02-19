import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Form, Button, Table, Modal, Image } from "react-bootstrap";
import Decimal from "decimal.js";
import loading2 from "../assets/loading2.gif";
import "../styles/formLayouts.css";
import "../styles/dynamicElements.css";
import "../styles/generalStyle.css";
import { getClient } from "../services/clientServices";
import { useEffect } from "react";
import {
  availableProducts,
  getProducts,
  getProductsWithStock,
  getUserStock,
  logShortage,
  productsDiscount,
  setTotalProductsToZero,
  updateForMissing,
  updateForMissingSample,
} from "../services/productServices";
import Cookies from "js-cookie";
import {
  availabilityInterval,
  createOrder,
  createOrderTransaction,
  deleteOrder,
  getOrderList,
  logOrderUpdate,
  sendOrderEmail,
  updateVirtualStock,
} from "../services/orderServices";
import { useNavigate } from "react-router-dom";
import { dateString } from "../services/dateServices";
import {
  christmassDiscounts,
  complexDiscountFunction,
  complexNewDiscountFunction,
  discountByAmount,
  easterDiscounts,
  halloweenDiscounts,
  manualAutomaticDiscount,
  newDiscountByAmount,
  processSeasonalDiscount,
  traditionalDiscounts,
  verifySeasonalProduct,
} from "../services/discountServices";
import ComplexDiscountTable from "./complexDiscountTable";
import SimpleDiscountTable from "./simpleDiscountTable";
import SpecialsTable from "./specialsTable";
import SinDescTable from "./sinDescTable";
import {
  getDiscountType,
  getSeasonalDiscount,
} from "../services/discountEndpoints";
import SeasonalDiscountTable from "./seasonalDiscountTable";
import { InputGroup } from "react-bootstrap";
import { userService } from "../services/userServices";
import { WholeSaleModal } from "./Modals/wholesaleModal";
import { getGalletonesIds } from "../services/saleServices";
import { getAllStores, getSupermarketSalas } from "../services/storeServices";
import {
  ExportProductsTemplate,
  ExportCurrentProducts,
} from "../services/exportServices";
export default function FormNewOrder() {
  const [isClient, setIsClient] = useState(false);
  const [isProduct, setIsProduct] = useState(false);
  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState([]);
  const [isLoading, setisLoading] = useState();
  const [isAlert, setIsAlert] = useState(false);
  const [alert, setAlert] = useState("");
  const [isAlertSec, setIsAlertSec] = useState(false);
  const [alertSec, setAlertSec] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [selectedProds, setSelectedProds] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [descuentoTotal, setDescuentoTotal] = useState(0);
  const [totalDesc, setTotalDesc] = useState(0);
  const [totalPrevio, setTotalPrevio] = useState(0);
  const [totalFacturar, setTotalFacturar] = useState(0);
  const [tipo, setTipo] = useState("normal");
  const [isDesc, setIsDesc] = useState(false);
  const [pedidoFinal, setPedidoFinal] = useState({});
  const [usuarioAct, setUsuarioAct] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [available, setAvailable] = useState([]);
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [userStore, setUserStore] = useState("");
  const [discountList, setDiscountList] = useState([]);
  const [tradicionales, setTradicionales] = useState([]);
  const [navidad, setNavidad] = useState([]);
  const [pascua, setPascua] = useState([]);
  const [halloween, setHalloween] = useState([]);
  const [especiales, setEspeciales] = useState([]);
  const [sinDesc, setSinDesc] = useState([]);
  const [discModal, setDiscModal] = useState(false);
  const [tradObject, setTradObject] = useState({});
  const [pasObject, setPasObject] = useState({});
  const [navObject, setNavObject] = useState({});
  const [hallObject, setHallObject] = useState({});
  const [sinDescObject, setSinDescObject] = useState({});
  const [espObject, setEspObject] = useState({});

  const [descSimple, setDescSimple] = useState({});
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [discModalType, setDiscModalType] = useState(true);
  const [filtered, setFiltered] = useState("");
  const [auxProds, setAuxProds] = useState([]);
  const [auxProducts, setAuxProducts] = useState([]);
  const [isSpecial, setIsSpecial] = useState(false);
  const [faltantes, setFaltantes] = useState([]);
  const [flagDiscount, setFlagDiscount] = useState(false);
  const [userName, setUserName] = useState("");
  const [isInterior, setIsInterior] = useState(false);
  const [isQuantity, setIsQuantity] = useState(false);
  const [modalQuantity, setModalQuantity] = useState("");
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 700 ? false : true,
  );
  const [currentProd, setCurrentProd] = useState("");
  const searchRef = useRef(null);
  const quantref = useRef(null);
  const prodTableRef = useRef(null);
  const productRef = useRef([]);
  const [clientInfo, setClientInfo] = useState({});
  const [seasonDiscountData, setSeasonDiscountData] = useState([]);
  const [isSeasonalModal, setIsSeasonalModal] = useState(false);
  async function listDiscounts(currentDate, tipo) {
    const discountList = await getSeasonalDiscount(currentDate, tipo);
    return discountList;
  }
  const [currentUsr, setCurrentUsr] = useState({});
  const [seasonalProds, setSeasonalProds] = useState([]);
  const [seasonalSinDesc, setSeasonalSinDesc] = useState([]);
  const [seasonalSpecial, setSeasonalSpecial] = useState([]);
  const [seasonalTotals, setSeasonalTotals] = useState({});

  const [discountType, setDiscountType] = useState("");
  const [isWholeModal, setIsWholeModal] = useState("");
  const [discSwitch, setDiscSwitch] = useState(true);
  const [storeList, setStoreList] = useState([]);
  const fileInputRef = useRef(null);
  const originalFileRef = useRef(null);
  const acceptable = ["xlsx", "xls"];
  const [isDragging, setIsDragging] = useState(false);
  const [originalOrderItems, setOriginalOrderItems] = useState([]);
  const [originalOrderFile, setOriginalOrderFile] = useState(null);
  const [selectedSala, setSelectedSala] = useState("");
  const [salasList, setSalasList] = useState([]);

  const productosCaja = [
    { codInterno: "716001", caja: 0.03 },
    { codInterno: "716002", caja: 0.03 },
    { codInterno: "716003", caja: 0.03 },
    { codInterno: "716005", caja: 0.22 },
    { codInterno: "716006", caja: 0.22 },
    { codInterno: "716008", caja: 0.05 },
    { codInterno: "716009", caja: 0.09 },
    { codInterno: "716013", caja: 0.15 },
    { codInterno: "716014", caja: 0.15 },
    { codInterno: "716022", caja: 0.06 },
    { codInterno: "716023", caja: 0.22 },
    { codInterno: "716024", caja: 0.01 },
    { codInterno: "716025", caja: 0.03 },
    { codInterno: "716026", caja: 0.04 },
    { codInterno: "716027", caja: 0.06 },
    { codInterno: "716028", caja: 0.09 },
    { codInterno: "716030", caja: 0.26 },
    { codInterno: "716031", caja: 0.43 },
    { codInterno: "716032", caja: 0.62 },
    { codInterno: "716033", caja: 1.62 },
    { codInterno: "716038", caja: 0.37 },
    { codInterno: "716040", caja: 1.08 },
    { codInterno: "716045", caja: 0.07 },
    { codInterno: "716046", caja: 0.06 },
    { codInterno: "716047", caja: 0.22 },
    { codInterno: "716048", caja: 0.06 },
    { codInterno: "716049", caja: 0.22 },
    { codInterno: "716051", caja: 0.18 },
    { codInterno: "716053", caja: 0.18 },
    { codInterno: "716055", caja: 0.03 },
    { codInterno: "716056", caja: 0.09 },
    { codInterno: "716057", caja: 0.05 },
    { codInterno: "716096", caja: 0.04 },
    { codInterno: "716064", caja: 0.04 },
    { codInterno: "716065", caja: 0.05 },
    { codInterno: "716066", caja: 0.05 },
    { codInterno: "716067", caja: 0.11 },
    { codInterno: "716069", caja: 0.06 },
    { codInterno: "716083", caja: 0.09 },
    { codInterno: "716084", caja: 0.09 },
    { codInterno: "716087", caja: 0.03 },
    { codInterno: "716089", caja: 0.06 },
    { codInterno: "716092", caja: 2.16 },
    { codInterno: "716058", caja: 0.06 },
    { codInterno: "716053", caja: 0.12 },
    { codInterno: "716059", caja: 0.32 },
    { codInterno: "716100", caja: 0.12 },
    { codInterno: "716101", caja: 0.12 },
    { codInterno: "716102", caja: 0.12 },
  ];

  const wholeSelected = Cookies.get("selectedwhole");

  const wholeParsed = wholeSelected ? JSON.parse(wholeSelected) : {};
  const wholeName = wholeSelected
    ? `- ${wholeParsed.nombre} ${wholeParsed.apPaterno} ${wholeParsed.apMaterno}`
    : "";
  const datosPaneton = [
    { codInterno: "715037", precio: 46.5, isNine: false },
    { codInterno: "715038", precio: 88.0, isNine: false },
    { codInterno: "718024", precio: 49.0, isNine: true },
  ];

  const userAuth = JSON.parse(Cookies.get("userAuth"));
  const tipoUsuarioAuth = Number(userAuth.tipoUsuario);

  // These calculations will automatically update whenever `selectedProds` changes
  const selectedProdsLength = selectedProds.length;
  console.warn("selectedProdsLength: ", selectedProdsLength); //jz 0
  const allProdsHaveMinCant = selectedProds.every(
    (prod) => Number(prod.cantProducto) >= 720,
  );
  console.warn("allProdsHaveMinCant: ", allProdsHaveMinCant); //jz TRUE
  const hasGalletones = selectedProds.some((sp) =>
    getGalletonesIds().includes(sp.idProducto),
  );
  const allAreGalletones = selectedProds.every((sp) =>
    getGalletonesIds().includes(sp.idProducto),
  );

  const showWarningGalletones =
    tipoUsuario === 2 &&
    (selectedProdsLength !== 1 || !allProdsHaveMinCant) &&
    hasGalletones;

  // Condition for showing SinDescTable
  const showSinDescTable =
    tipoUsuario === 2 && hasGalletones
      ? selectedProdsLength !== 1 && !allProdsHaveMinCant
      : true;

  const meetsExactGalletonCondition =
    tipoUsuario === 2 &&
    selectedProdsLength === 1 &&
    selectedProds.every(
      (sp) =>
        getGalletonesIds().includes(sp.idProducto) &&
        Number(sp.cantProducto) >= 720,
    );

  useEffect(() => {
    console.log("Selected Prods changed: ", selectedProds);
    const UsuarioAct = Cookies.get("userAuth");
    if (UsuarioAct) {
      const parsed = JSON.parse(UsuarioAct);
      if (parsed.rol == 13) {
        const selectedWhole = Cookies.get("selectedwhole");
        if (selectedWhole) {
          const parsedWhole = JSON.parse(selectedWhole);
          console.log("Selected whole", JSON.parse(selectedWhole));
          setCurrentUsr(JSON.parse(UsuarioAct));
          setUserEmail(parsedWhole.correo);
          setUserStore(parsedWhole.idAlmacen);
          if (parsedWhole.idDepto != 1) {
            setIsInterior(true);
          }
          setUserName(
            `${parsedWhole.nombre.substring(0, 1)}${parsedWhole.apPaterno}`,
          );
          const currentDate = dateString();
          const list = listDiscounts(
            currentDate,
            JSON.parse(UsuarioAct).tipoUsuario,
          );
          list.then((l) => {
            console.log("Descuento de temporada", l.data.data);
            setSeasonDiscountData(l.data.data);
          });
          const dType = getDiscountType();
          dType.then((dt) => {
            console.log("Tipo de descuento", dt.data);
            setDiscountType(dt.data.idTipoDescuento);
          });
          setUsuarioAct(parsedWhole.idUsuario);
          setTipoUsuario(parsedWhole.tipoUsuario);
          const disponibles = availableProducts(parsedWhole.idUsuario);
          disponibles.then((fetchedAvailable) => {
            const filtered = fetchedAvailable.data.data.filter(
              (product) => product.cant_Actual > 0 && product.activo === 1,
            );
            /**
             const filtered = fetchedAvailable.data.data.filter(
              (product) => product.cant_Actual > 0 && product.activo === 1
            ); 

             */
            console.log("Productos disponibles", filtered);
            setAvailable(filtered);
            setAuxProducts(filtered);
            productRef.current = filtered;
          });
          const dl = productsDiscount(
            JSON.parse(Cookies.get("userAuth")).idUsuario,
          );
          dl.then((res) => {
            setDiscountList(res.data.data);
          });
        } else {
          setIsWholeModal(true);
        }
      } else {
        setUserEmail(JSON.parse(UsuarioAct).correo);
        setUserStore(JSON.parse(UsuarioAct).idAlmacen);
        if (JSON.parse(UsuarioAct).idDepto != 1) {
          setIsInterior(true);
        }
        setUserName(
          `${JSON.parse(UsuarioAct).nombre.substring(0, 1)}${
            JSON.parse(UsuarioAct).apPaterno
          }`,
        );
        const currentDate = dateString();
        const list = listDiscounts(
          currentDate,
          JSON.parse(UsuarioAct).tipoUsuario,
        );
        list.then((l) => {
          console.log("Descuento de temporada", l.data.data);
          setSeasonDiscountData(l.data.data);
        });
        const dType = getDiscountType();
        dType.then((dt) => {
          console.log("Tipo de descuento", dt.data);
          setDiscountType(dt.data.idTipoDescuento);
        });
        setUsuarioAct(JSON.parse(Cookies.get("userAuth")).idUsuario);
        setTipoUsuario(JSON.parse(Cookies.get("userAuth")).tipoUsuario);
        const disponibles = availableProducts(
          JSON.parse(Cookies.get("userAuth")).idUsuario,
        );
        disponibles.then((fetchedAvailable) => {
          console.log("products", fetchedAvailable);
          const filtered = fetchedAvailable.data.data.filter(
            (product) => product.cant_Actual > 0 && product.activo === 1,
          );
          /**
           *  const filtered = fetchedAvailable.data.data.filter(
            (product) => product.cant_Actual > 0 && product.activo === 1
          );
           */
          console.log("Productos disponibles", filtered);
          setAvailable(filtered);
          setAuxProducts(filtered);
          productRef.current = filtered;
        });
        const dl = productsDiscount(
          JSON.parse(Cookies.get("userAuth")).idUsuario,
        );
        dl.then((res) => {
          setDiscountList(res.data.data);
        });
      }
    }

    const stores = getAllStores();
    stores.then((st) => {
      setStoreList(st.data);
    });

    // Fetch supermarket salas
    getSupermarketSalas()
      .then((res) => {
        setSalasList(res.data);
      })
      .catch((err) => {
        console.log("Error al cargar salas de supermercado", err);
      });
  }, []);

  function updateCurrentStock() {
    setAvailable([]);
    setAuxProducts([]);
    const disponibles = availableProducts(
      JSON.parse(Cookies.get("userAuth")).idUsuario,
    );
    disponibles.then((fetchedAvailable) => {
      const filtered = fetchedAvailable.data.data.filter(
        (product) => product.cant_Actual > 0 && product.activo === 1,
      );
      /** const filtered = fetchedAvailable.data.data.filter(
        (product) => product.cant_Actual > 0 && product.activo === 1
      ); */
      console.log("Productos disponibles", filtered);
      setAvailable(filtered);
      setAuxProducts(filtered);
    });
  }

  useEffect(() => {
    if (isQuantity) {
      quantref.current.focus();
    }
  }, [isQuantity]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 700) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }
    handleResize(); // set the initial state on mount
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (flagDiscount) {
      verifySeasonal();
    }
  }, [flagDiscount]);
  function searchClient(e) {
    e.preventDefault();
    setIsSelected(false);
    setClientes([]);
    setisLoading(true);
    const found = getClient(search);

    found.then((res) => {
      setIsClient(true);
      if (res.data.data) {
        setClientes(res.data.data);
        setisLoading(false);
      } else {
        setIsClient(false);
        setIsAlert(true);
        setAlert("Usuario no encontrado");
      }
    });
  }
  function filterSelectedClient(id) {
    setSelectedClient(id);
    const searchObject = clientes.find((cli) => cli.idCliente === id);
    console.log("cliente", searchObject);
    setClientInfo({
      idZona: searchObject.idZona,
      nitCliente: searchObject.nit,
    });
    const array = [];
    array.push(searchObject);
    setClientes(array);
    setIsSelected(true);
    prodTableRef.current.scrollIntoView({ behavior: "smooth" });
  }

  function updateCurrentStock() {
    setAvailable([]);
    setAuxProducts([]);
    const UsuarioAct = Cookies.get("userAuth");
    const prods = availableProducts(JSON.parse(UsuarioAct).idUsuario);
    prods.then((product) => {
      console.log("TESTEANDO ACA", product);
      const available = product.data.data.filter((prod) => prod.activo === 1);
      console.log("disponibles", available);
      setAvailable(available);
      setAuxProducts(available);
    });
  }

  function selectProduct(product) {
    const parsed = JSON.parse(product);
    console.log("Producto seleccionado", parsed);
    const foundProt = productosCaja.find(
      (pc) => pc.codInterno == parsed.codInterno,
    );
    console.log("Found prot", foundProt);
    console.log("Tipo usuario", tipoUsuario);
    const prorrateo = tipoUsuario == 2 ? (foundProt ? foundProt?.caja : 0) : 0;
    var aux = false;
    console.log("Is super?", clientes[0]?.issuper == 1);

    const isInterior =
      storeList.find((sl) => sl.idagencia == userStore)?.idDepto !== 1;

    const precioElegido =
      clientes[0]?.issuper == 1
        ? parsed.precioSuper
        : isInterior
          ? parsed.precioPDV
          : parsed.precioDeFabrica;

    const prodObj = {
      cantPrevia: 0,
      cantProducto: 0,
      cant_Actual: parsed.cant_Actual,
      codInterno: parsed.codInterno,
      idProducto: parsed.idProducto,
      nombreProducto: parsed.nombreProducto,
      precioDeFabrica: precioElegido + prorrateo,
      precioDescuentoFijo: parsed.precioDescuentoFijo + prorrateo,
      codigoBarras: parsed.codigoBarras,
      totalProd: 0,
      totalDescFijo: 0,
      tipoProducto: parsed.tipoProducto,
      descuentoProd: 0,
      unidadDeMedida: parsed.unidadDeMedida,
      tipo_descuento: parsed.tipo_descuento,
    };
    selectedProds.map((sp) => {
      if (sp.codInterno === JSON.parse(product).codInterno) {
        aux = true;
      }
    });
    if (!aux) {
      switch (parsed.tipo_descuento) {
        case 1:
          switch (parsed.tipoProducto) {
            case 1:
              setTradicionales([...tradicionales, prodObj]);
              break;
            case 2:
              setPascua([...pascua, prodObj]);
              break;
            case 3:
              setNavidad([...navidad, prodObj]);
              break;
            case 4:
              setHalloween([...halloween, prodObj]);
              break;
          }
          break;
        case 2:
          setSinDesc([...sinDesc, prodObj]);
          break;
        case 3:
          setEspeciales([...especiales, prodObj]);
          break;
      }

      setSelectedProds([...selectedProds, prodObj]);
      console.warn("selectedProds after adding: ", [...selectedProds, prodObj]); //jz
    }
    setCurrentProd(prodObj);
    setIsProduct(true);
    setIsQuantity(true);
  }
  const handleClose = () => {
    setIsAlert(false);
    setisLoading(false);
    setDiscModal(false);
  };
  function deleteProduct(index, cod, prod) {
    const auxArray = [...selectedProds];
    auxArray.splice(index, 1);
    setSelectedProds(auxArray);
    switch (prod.tipo_descuento) {
      case 1:
        switch (prod.tipoProducto) {
          case 1:
            const tindex = tradicionales.findIndex(
              (td) => td.idProducto == cod,
            );
            const taux = [...tradicionales];
            taux.splice(tindex, 1);
            setTradicionales(taux);
            break;
          case 2:
            const pindex = pascua.findIndex((ps) => ps.idProducto == cod);
            const paux = [...pascua];
            paux.splice(pindex, 1);
            setPascua(paux);
            break;
          case 3:
            const nindex = navidad.findIndex((nv) => nv.idProducto == cod);
            const naux = [...navidad];
            naux.splice(nindex, 1);
            setNavidad(naux);
            break;
          case 4:
            const hindex = halloween.findIndex((hl) => hl.idProducto == cod);
            const haux = [...halloween];
            haux.splice(hindex, 1);
            setHalloween(haux);
            break;
        }
        break;
      case 2:
        const sindex = sinDesc.findIndex((sd) => sd.idProducto == cod);
        const saux = [...sinDesc];
        saux.splice(sindex, 1);
        setSinDesc(saux);
        break;
      case 3:
        const eindex = especiales.findIndex((ep) => ep.idProducto == cod);
        const eaux = [...especiales];
        eaux.splice(eindex, 1);
        setEspeciales(eaux);
        break;
    }
  }
  function changeQuantitys(index, cantidades, prod) {
    let auxObj = {
      cant_Actual: prod.cant_Actual,
      cantPrevia: prod.cantPrevia,
      cantProducto: cantidades,
      codInterno: prod.codInterno,
      codigoBarras: prod.codigoBarras,
      idProducto: prod.idProducto,
      nombreProducto: prod.nombreProducto,
      precioDeFabrica: prod.precioDeFabrica,
      precioDescuentoFijo: prod.precioDescuentoFijo,
      totalProd: new Decimal(cantidades)
        .times(prod.precioDeFabrica)
        .toDecimalPlaces(2)
        .toNumber(),
      totalDescFijo: new Decimal(cantidades)
        .times(prod.precioDescuentoFijo)
        .toDecimalPlaces(2)
        .toNumber(),
      tipoProducto: prod.tipoProducto,
      descuentoProd: 0,
      unidadDeMedida: prod.unidadDeMedida,
      tipo_descuento: prod.tipo_descuento,
    };
    let auxSelected = [...selectedProds];
    auxSelected[index] = auxObj;
    setSelectedProds(auxSelected);

    switch (prod.tipo_descuento) {
      case 1:
        switch (prod.tipoProducto) {
          case 1:
            const tindex = tradicionales.findIndex(
              (td) => td.idProducto == prod.idProducto,
            );
            const taux = [...tradicionales];
            taux[tindex] = auxObj;
            setTradicionales(taux);
            break;
          case 2:
            const pindex = pascua.findIndex(
              (ps) => ps.idProducto == prod.idProducto,
            );
            const paux = [...pascua];
            paux[pindex] = auxObj;
            setPascua(paux);
            break;
          case 3:
            const nindex = navidad.findIndex(
              (nv) => nv.idProducto == prod.idProducto,
            );
            const naux = [...navidad];
            naux[nindex] = auxObj;
            setNavidad(naux);
            break;
          case 4:
            const hindex = halloween.findIndex(
              (hl) => hl.idProducto == prod.idProducto,
            );
            const haux = [...halloween];
            haux[hindex] = auxObj;
            setHalloween(haux);
            break;
        }
        break;
      case 2:
        const sindex = sinDesc.findIndex(
          (sd) => sd.idProducto == prod.idProducto,
        );
        const saux = [...sinDesc];
        saux[sindex] = auxObj;
        setSinDesc(saux);
        break;
      case 3:
        const espIndex = especiales.findIndex(
          (ep) => ep.codInterno == prod.codInterno,
        );

        const eaux = [...especiales];
        eaux[espIndex] = auxObj;
        setEspeciales(eaux);
        break;
    }
  }

  function handleType(value) {
    setTipo(value);
    if (
      value === "muestra" ||
      value === "consignacion" ||
      value === "reserva"
    ) {
      setDescuento(0);
      setIsDesc(true);
    } else {
      setIsDesc(false);
    }
  }
  function structureOrder(availables) {
    return new Promise((resolve) => {
      var error = false;
      if (selectedClient === "") {
        error = true;
        setAlert("Seleccione un cliente por favor");
      }
      if (selectedProds.length === 0) {
        error = true;
        setAlert("Por favor seleccione al menos un producto");
      }
      selectedProds.map((pr) => {
        if (pr.cantProducto < 0.01 || pr.cantProducto === "") {
          error = true;
          setAlert("La cantidad elegida de algun producto esta en 0");
        }
      });
      resolve(error);
    });
  }

  async function validateAvailability() {
    setDiscModal(false);
    setIsAlertSec(true);
    setAlertSec("Validando Pedido");
    setTimeout(() => {
      const validateAva = availabilityInterval();
      validateAva.then((res) => {
        const disponibles = availableProducts(
          JSON.parse(Cookies.get("userAuth")).idUsuario,
        );
        disponibles.then((fetchedAvailable) => {
          const avaSetted = async () => {
            const setted = asyncSetAva(fetchedAvailable.data.data);
            setted.then((res) => {
              setIsAlertSec(false);
              saveOrder(fetchedAvailable.data.data[0]);
            });
          };
          avaSetted();
        });
      });
    }, 200);
  }

  function validateQuantities() {
    var errorList = 0;
    for (const product of selectedProds) {
      if (product.cantProducto > product.cant_Actual) {
        errorList += 1;
      }
    }
    return errorList;
  }

  const asyncSetAva = (array) => {
    return new Promise((resolve) => {
      setAvailable(array);
      resolve(true);
    });
  };

  function saveOrder(availables) {
    console.warn("saveOrder. availables:", availables);
    const everyGalleton = meetsExactGalletonCondition;
    const validatedOrder = structureOrder(availables);
    validatedOrder.then(async (res) => {
      setisLoading(true);
      if (!res) {
        setAlertSec("Creando pedido ...");
        setIsAlertSec(true);
        const totalFacturarDec = new Decimal(totalFacturar);
        const montoConDescuentos = everyGalleton
          ? totalFacturarDec.minus(totalFacturarDec.times(0.08))
          : totalFacturarDec;
        const descTotalAplicado = new Decimal(descuentoTotal).greaterThan(0)
          ? montoConDescuentos.times(new Decimal(descuentoTotal)).dividedBy(100)
          : new Decimal(0);
        const montoFinal = montoConDescuentos.minus(descTotalAplicado);
        const descCalculadoFinal = everyGalleton
          ? new Decimal(totalPrevio).times(0.08).plus(descTotalAplicado)
          : new Decimal(totalDesc).plus(descTotalAplicado);

        const objPedido = {
          pedido: {
            idUsuarioCrea: usuarioAct,
            idUsuario: usuarioAct,
            idCliente: selectedClient,
            fechaCrea: dateString(),
            fechaActualizacion: dateString(),
            estado: 0,
            montoFacturar: new Decimal(totalPrevio)
              .toDecimalPlaces(2)
              .toNumber(),
            montoTotal: montoFinal.toDecimalPlaces(2).toNumber(),
            tipo: tipo,
            descuento: everyGalleton ? 8 : descuento,
            descCalculado: descCalculadoFinal.toDecimalPlaces(2).toNumber(),
            notas: everyGalleton
              ? `Descuento de 8% por compra de galletones ${userName}${
                  descuentoTotal > 0 ? ` + Desc. Total: ${descuentoTotal}%` : ""
                }:
observaciones: ${observaciones}`
              : `${
                  descuentoTotal > 0 ? `Desc. Total: ${descuentoTotal}% - ` : ""
                }${observaciones}`,
            impreso: isInterior ? 1 : 0,
          },
          productos: selectedProds,
        };
        // console.warn("Productos para pedido", selectedProds);

        console.log("Objeto pedido", objPedido);
        //setPedidoFinal(ped);

        const objSubmit = {
          objOrder: objPedido,
          userStore: userStore,
          products: selectedProds,
          originalOrderItems:
            originalOrderItems.length > 0 ? originalOrderItems : undefined,
          supermarketSala: selectedSala || undefined,
        };
        try {
          const processOrder = await createOrderTransaction(objSubmit);
          console.log("Respuesta de creacion", processOrder.data);
          const codPedido = await getOrderList(processOrder.data.idCreado);
          const emailBody = {
            codigoPedido: processOrder.data.idCreado,
            correoUsuario: userEmail,
            fecha: dateString(),
            email: [userEmail],
            tipo: "Pedido",
            header: "Pedido Creado",
          };
          //const emailSent = await sendOrderEmail(emailBody);

          const objPedidoNew = {
            pedido: {
              idPedido: processOrder.data.idCreado,
              idUsuarioCrea: usuarioAct,
              idUsuario: usuarioAct,
              idCliente: selectedClient,
              fechaCrea: dateString(),
              fechaActualizacion: dateString(),
              estado: 0,
              montoFacturar: new Decimal(totalPrevio)
                .toDecimalPlaces(2)
                .toNumber(),
              montoTotal: montoFinal.toDecimalPlaces(2).toNumber(),
              tipo: tipo,
              descuento: everyGalleton ? 8 : descuento,
              descCalculado: descCalculadoFinal.toDecimalPlaces(2).toNumber(),
              notas: `${
                descuentoTotal > 0 ? `Desc. Total: ${descuentoTotal}% - ` : ""
              }${observaciones}`,
              impreso: isInterior ? 1 : 0,
            },
            productos: selectedProds,
          };

          console.log("Objeto pedido", objPedidoNew);
          await logOrderUpdate(objPedidoNew);

          setIsAlertSec(false);
          setAlert("Pedido Creado correctamente");
          setIsAlert(true);

          setTimeout(() => {
            window.location.reload();
            Cookies.remove("selectedwhole");
            setisLoading(false);
          }, 3000);
        } catch (error) {
          updateCurrentStock();
          console.log("Error al crear el pedido 1", error);
          const errorMes = error.response.data
            .toString()
            .includes("stock_nonnegative")
            ? "Uno de los productos ya no cuenta con la cantidad solicitada de stock"
            : "Error en el Pedido";
          setIsAlertSec(false);
          setAlert(errorMes);
          setIsAlert(true);
        }
      } else {
        setIsAlert(true);
      }
    });
  }

  function saveSampleAndTransfer() {
    console.warn("saveSampleAndTransfer");
    const total = selectedProds.reduce((accumulator, object) => {
      return accumulator + Number(object.totalProd);
    }, 0);
    const totalDec = new Decimal(total);
    const descTotalAplicadoSample = new Decimal(descuentoTotal).greaterThan(0)
      ? totalDec.times(new Decimal(descuentoTotal)).dividedBy(100)
      : new Decimal(0);
    const montoFinalSample = totalDec.minus(descTotalAplicadoSample);

    const arrayInZero = setTotalProductsToZero(selectedProds);
    arrayInZero.then((zero) => {
      const validatedOrder = structureOrder();
      validatedOrder.then(async (res) => {
        setisLoading(true);
        if (!res) {
          setAlertSec("Creando pedido ...");
          setIsAlertSec(true);
          let objPedido = {
            pedido: {
              idUsuarioCrea: usuarioAct,
              idUsuario: usuarioAct,
              idCliente: selectedClient,
              fechaCrea: dateString(),
              fechaActualizacion: dateString(),
              estado: 0,
              montoFacturar: totalDec.toDecimalPlaces(2).toNumber(),
              montoTotal: montoFinalSample.toDecimalPlaces(2).toNumber(),
              tipo: tipo,
              descuento: descuentoTotal > 0 ? descuentoTotal : 0,
              descCalculado: descTotalAplicadoSample
                .toDecimalPlaces(2)
                .toNumber(),
              notas: `${
                descuentoTotal > 0 ? `Desc. Total: ${descuentoTotal}% - ` : ""
              }${observaciones}`,
              impreso: isInterior ? 1 : 0,
            },
            productos: zero.modificados,
          };
          console.log("Objeto pedido", objPedido);
          const objSubmit = {
            objOrder: objPedido,
            userStore: userStore,
            products: zero.modificados,
            originalOrderItems:
              originalOrderItems.length > 0 ? originalOrderItems : undefined,
            supermarketSala: selectedSala || undefined,
          };
          try {
            const processOrder = await createOrderTransaction(objSubmit);
            console.log("Respuesta de creacion", processOrder.data);
            const codPedido = await getOrderList(processOrder.data.idCreado);

            const emailBody = {
              codigoPedido: processOrder.data.idCreado,
              correoUsuario: userEmail,
              fecha: dateString(),
              email: [userEmail],
              tipo: "Pedido",
              header: "Pedido Creado",
            };

            if (tipo === "consignacion") {
              console.log("Updating virtual stock");

              const virtualStockObject = {
                accion: "add",
                clientInfo: clientInfo,
                productos: selectedProds,
              };

              await updateVirtualStock(virtualStockObject);
            }

            //const emailSent = await sendOrderEmail(emailBody);
            console.log("OBJ Pedido CONSIG", objPedido);
            objPedido.pedido.idPedido = processOrder.data.idCreado;
            await logOrderUpdate(objPedido);

            setIsAlertSec(false);
            setAlert("Pedido Creado correctamente");
            setIsAlert(true);

            setTimeout(() => {
              window.location.reload();
              setisLoading(false);
            }, 3000);
          } catch (error) {
            updateCurrentStock();
            console.log("Error al crear el pedido 1", error);
            const errorMes = error.response.data
              .toString()
              .includes("stock_nonnegative")
              ? "Uno de los productos ya no cuenta con la cantidad solicitada de stock"
              : "Error en el Pedido";
            setIsAlertSec(false);
            setAlert(errorMes);
            setIsAlert(true);
          }
        } else {
          setIsAlert(true);
        }
      });
    });
  }

  function handleDiscount(value) {
    setDescuento(value);
  }

  function validateProductLen() {
    console.warn("validateProductLen");
    const validated = validateQuantities();
    console.warn("validated: ", validated);
    // if (validated === 0) {
    console.log("Es interior", isInterior);
    if (selectedClient != "") {
      if (selectedProds.length > 0) {
        setAuxProds(selectedProds);
        if (tipo == "normal") {
          verifySeasonal();
        } else {
          saveSampleAndTransfer();
        }
      } else {
        setAlert("Seleccione al menos un producto por favor");
        setIsAlert(true);
      }
    } else {
      setAlert("Seleccione un cliente por favor");

      setIsAlert(true);
    }
    // } else {
    //   setAlert(
    //     "Una de las cantidades seleccionadas no se encuentra disponible",
    //   );

    //   setIsAlert(true);
    // }
  }

  async function processDiscounts() {
    console.log("Tipo usuario", tipoUsuario);
    if (![2, 3, 4].includes(tipoUsuario) || !discSwitch) {
      //const objDesc = discountByAmount(selectedProds, descuento);
      const objDescNew = newDiscountByAmount(selectedProds, descuento);
      console.log("Obj desc new", objDescNew);
      setDescSimple(objDescNew);
      setTotalDesc(objDescNew.descCalculado);
      setTotalPrevio(
        Number(
          Number(objDescNew.totalEspecial) +
            Number(objDescNew.totalDescontables),
        ),
      );
      setTotalFacturar(
        Number(
          Number(objDescNew.totalTradicional) +
            Number(objDescNew.totalEspecial),
        ),
      );
      console.log(
        "CHEKIANDO ESTO",
        Number(
          Number(objDescNew.totalTradicional) +
            Number(objDescNew.totalEspecial),
        ),
      );
      setDiscModalType(false);
      setSelectedProds(objDescNew.productosReprocesados);
      console.warn(
        "objDescNew.productosReprocesados: ",
        objDescNew.productosReprocesados,
      );

      setDiscModal(true);
    } else {
      const dType = await getDiscountType();
      const discountObject =
        dType.data.idTipoDescuento == 1
          ? complexDiscountFunction(selectedProds, discountList)
          : complexNewDiscountFunction(selectedProds, discountList);
      console.log("DISCOUNT OBJECT", discountObject);
      setTradObject(discountObject.tradicionales);
      setPasObject(discountObject.pascua);
      setNavObject(discountObject.navidad);
      setHallObject(discountObject.halloween);
      setSinDescObject(discountObject.sinDescuento);
      setEspObject(discountObject.especiales);
      setTotalDesc(
        Number(discountObject.tradicionales.descCalculado) +
          Number(discountObject.pascua.descCalculado) +
          Number(discountObject.navidad.descCalculado) +
          Number(discountObject.halloween.descCalculado),
      );
      console.log(
        "DESCUENTO CALCULADO",
        Number(discountObject.tradicionales.descCalculado) +
          Number(discountObject.pascua.descCalculado) +
          Number(discountObject.navidad.descCalculado) +
          Number(discountObject.halloween.descCalculado),
      );
      setTotalPrevio(
        Number(discountObject.tradicionales.total) +
          Number(discountObject.pascua.total) +
          Number(discountObject.navidad.total) +
          Number(discountObject.halloween.total) +
          Number(discountObject.sinDescuento.total) +
          Number(discountObject.especiales.total),
      );
      setTotalFacturar(
        Number(discountObject.tradicionales.facturar) +
          Number(discountObject.pascua.facturar) +
          Number(discountObject.navidad.facturar) +
          Number(discountObject.halloween.facturar) +
          Number(discountObject.especiales.facturar) +
          Number(discountObject.sinDescuento.facturar),
      );
      setIsSpecial(discountObject.tradicionales.especial);
      setDiscModalType(true);
      setDiscModal(true);
    }
  }

  async function verifySeasonal() {
    console.warn("verifySeasonal");
    if (seasonDiscountData.length > 0) {
      console.log("es seasonDiscountData.length > 0");
      const verified = verifySeasonalProduct(selectedProds, seasonDiscountData);
      if (verified) {
        setDiscModalType(false);
        const data = await processSeasonalDiscount(
          selectedProds,
          seasonDiscountData,
        );
        setTotalPrevio(data.totalesPedido.totalPedido);
        setTotalFacturar(data.totalesPedido.totalFacturar);
        setTotalDesc(data.totalesPedido.descCalculado);
        setDescuento(data.totalesPedido.descuento);
        setSeasonalSpecial(data.productArrays.especialDescProds);
        setSeasonalProds(data.productArrays.seasonProducts);
        setSeasonalSinDesc(data.productArrays.sinDescProds);
        setSeasonalTotals(data.totalesPedido);
        setIsSeasonalModal(true);
        setDiscModal(true);
        console.log("Data", data);
      } else {
        processDiscounts();
      }
    } else {
      processDiscounts();
    }
  }

  function cancelDiscounts() {
    setSelectedProds(auxProds, discountList);
    setDiscModal(false);
  }
  function filterProducts(value) {
    setFiltered(value);
    const newList = auxProducts.filter(
      (dt) =>
        dt.nombreProducto.toLowerCase().includes(value.toLowerCase()) ||
        dt.codInterno.toString().includes(value.toString()) ||
        dt.codigoBarras.toString().includes(value.toString()),
    );
    setAvailable([...newList]);
  }
  function addWithScanner(e) {
    e.preventDefault();
    if (available.length == 1) {
      setAvailable(auxProducts);
      setFiltered("");
      selectProduct(JSON.stringify(available[0]));
    } else {
      if (available.length == 0) {
        setAlert("Producto no encontrado");
        setIsAlert(true);
        setAvailable(auxProducts);
        setFiltered("");
      }
    }
  }

  function changeQuantitiesModal(e) {
    e.preventDefault();
    const index = selectedProds.length - 1;
    const selectedProd = selectedProds[index];
    changeQuantitys(index, modalQuantity, selectedProd, false);
    setIsQuantity(false);
    setModalQuantity("");
    setAvailable(auxProducts);
    searchRef.current.focus();
  }

  function changePrice(index, value, prod) {
    let auxObj = {
      cant_Actual: prod.cant_Actual,
      cantPrevia: prod.cantPrevia,
      cantProducto: prod.cantProducto,
      codInterno: prod.codInterno,
      codigoBarras: prod.codigoBarras,
      idProducto: prod.idProducto,
      nombreProducto: prod.nombreProducto,
      precioDeFabrica: value,
      precioDescuentoFijo: prod.precioDescuentoFijo,
      totalProd: new Decimal(prod.cantProducto)
        .times(value)
        .toDecimalPlaces(2)
        .toNumber(),
      totalDescFijo: new Decimal(prod.cantProducto)
        .times(prod.precioDescuentoFijo)
        .toDecimalPlaces(2)
        .toNumber(),
      tipoProducto: prod.tipoProducto,
      descuentoProd: 0,
      unidadDeMedida: prod.unidadDeMedida,
      tipo_descuento: prod.tipo_descuento,
    };
    let auxSelected = [...selectedProds];
    auxSelected[index] = auxObj;
    setSelectedProds(auxSelected);

    switch (prod.tipo_descuento) {
      case 1:
        switch (prod.tipoProducto) {
          case 1:
            const tindex = tradicionales.findIndex(
              (td) => td.idProducto == prod.idProducto,
            );
            const taux = [...tradicionales];
            taux[tindex] = auxObj;
            setTradicionales(taux);
            break;
          case 2:
            const pindex = pascua.findIndex(
              (ps) => ps.idProducto == prod.idProducto,
            );
            const paux = [...pascua];
            paux[pindex] = auxObj;
            setPascua(paux);
            break;
          case 3:
            const nindex = navidad.findIndex(
              (nv) => nv.idProducto == prod.idProducto,
            );
            const naux = [...navidad];
            naux[nindex] = auxObj;
            setNavidad(naux);
            break;
          case 4:
            const hindex = halloween.findIndex(
              (hl) => hl.idProducto == prod.idProducto,
            );
            const haux = [...halloween];
            haux[hindex] = auxObj;
            setHalloween(haux);
            break;
        }
        break;
      case 2:
        const sindex = sinDesc.findIndex(
          (sd) => sd.idProducto == prod.idProducto,
        );
        const saux = [...sinDesc];
        saux[sindex] = auxObj;
        setSinDesc(saux);
        break;
      case 3:
        const espIndex = especiales.findIndex(
          (ep) => ep.codInterno == prod.codInterno,
        );

        const eaux = [...especiales];
        eaux[espIndex] = auxObj;
        setEspeciales(eaux);
        break;
    }
  }

  const checkFileExtension = (name) => {
    return acceptable.includes(name.split(".").pop().toLowerCase());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processExcelFile(files[0]);
    }
  };

  async function handleExcelUpload(fileInput) {
    const fileObj = fileInput.target.files[0];
    if (!fileObj) return;
    processExcelFile(fileObj);
    fileInputRef.current.value = "";
  }

  async function processExcelFile(fileObj) {
    if (!checkFileExtension(fileObj.name)) {
      setAlert("Tipo de archivo inválido. Use archivos .xlsx o .xls");
      setIsAlert(true);
      return;
    }

    try {
      const data = await fileObj.arrayBuffer();
      const wb = XLSX.read(data);
      const sheetName = wb.SheetNames[0];
      const workSheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(workSheet);

      if (jsonData.length === 0) {
        setAlert("El archivo está vacío");
        setIsAlert(true);
        return;
      }

      // Clear current products arrays
      setSelectedProds([]);
      setTradicionales([]);
      setPascua([]);
      setNavidad([]);
      setHalloween([]);
      setSinDesc([]);
      setEspeciales([]);

      let addedCount = 0;
      let notFoundProducts = [];
      const newSelectedProds = [];
      const newTradicionales = [];
      const newPascua = [];
      const newNavidad = [];
      const newHalloween = [];
      const newSinDesc = [];
      const newEspeciales = [];

      const isInteriorLocal =
        storeList.find((sl) => sl.idagencia == userStore)?.idDepto !== 1;

      jsonData.forEach((row) => {
        if (row.CODINTERNO === undefined || row.CANTIDAD === undefined) {
          return;
        }

        const codInterno = String(row.CODINTERNO).replace("Ejemplo: ", "");
        const cantidad = parseFloat(
          String(row.CANTIDAD).replace("Ejemplo: ", ""),
        );

        if (isNaN(cantidad) || cantidad <= 0) return;

        const foundProduct = auxProducts.find(
          (ap) => String(ap.codInterno) === codInterno,
        );

        if (foundProduct) {
          const alreadyAdded = newSelectedProds.find(
            (sp) => sp.codInterno === foundProduct.codInterno,
          );

          if (!alreadyAdded) {
            const foundProt = productosCaja.find(
              (pc) => pc.codInterno === foundProduct.codInterno,
            );
            const prorrateo =
              tipoUsuario === 2 ? (foundProt ? foundProt.caja : 0) : 0;

            const precioElegido =
              clientes[0]?.issuper === 1
                ? foundProduct.precioSuper
                : isInteriorLocal
                  ? foundProduct.precioPDV
                  : foundProduct.precioDeFabrica;

            const prodObj = {
              cantPrevia: 0,
              cantProducto: cantidad,
              cant_Actual: foundProduct.cant_Actual,
              codInterno: foundProduct.codInterno,
              idProducto: foundProduct.idProducto,
              nombreProducto: foundProduct.nombreProducto,
              precioDeFabrica: precioElegido + prorrateo,
              precioDescuentoFijo: foundProduct.precioDescuentoFijo + prorrateo,
              codigoBarras: foundProduct.codigoBarras,
              totalProd: new Decimal(cantidad)
                .times(new Decimal(precioElegido).plus(prorrateo))
                .toDecimalPlaces(2)
                .toNumber(),
              totalDescFijo: new Decimal(cantidad)
                .times(
                  new Decimal(foundProduct.precioDescuentoFijo).plus(prorrateo),
                )
                .toDecimalPlaces(2)
                .toNumber(),
              tipoProducto: foundProduct.tipoProducto,
              descuentoProd: 0,
              unidadDeMedida: foundProduct.unidadDeMedida,
              tipo_descuento: foundProduct.tipo_descuento,
            };

            switch (foundProduct.tipo_descuento) {
              case 1:
                switch (foundProduct.tipoProducto) {
                  case 1:
                    newTradicionales.push(prodObj);
                    break;
                  case 2:
                    newPascua.push(prodObj);
                    break;
                  case 3:
                    newNavidad.push(prodObj);
                    break;
                  case 4:
                    newHalloween.push(prodObj);
                    break;
                }
                break;
              case 2:
                newSinDesc.push(prodObj);
                break;
              case 3:
                newEspeciales.push(prodObj);
                break;
            }

            newSelectedProds.push(prodObj);
            addedCount++;
          }
        } else {
          notFoundProducts.push(codInterno);
        }
      });

      // Set all arrays at once
      setSelectedProds(newSelectedProds);
      setTradicionales(newTradicionales);
      setPascua(newPascua);
      setNavidad(newNavidad);
      setHalloween(newHalloween);
      setSinDesc(newSinDesc);
      setEspeciales(newEspeciales);

      let message = `Se cargaron ${addedCount} productos (reemplazando anteriores).`;
      if (notFoundProducts.length > 0) {
        message += ` No se encontraron: ${notFoundProducts
          .slice(0, 5)
          .join(", ")}${notFoundProducts.length > 5 ? "..." : ""}`;
        message += ` No se encontraron: ${notFoundProducts
          .slice(0, 5)
          .join(", ")}${notFoundProducts.length > 5 ? "..." : ""}`;
      }
      setAlert(message);
      setIsAlert(true);
      setIsProduct(true);
    } catch (error) {
      setAlert("Error al procesar el archivo Excel");
      setIsAlert(true);
    }
  }

  function handleExportCurrentProducts() {
    if (selectedProds.length === 0) {
      setAlert("No hay productos para exportar");
      setIsAlert(true);
      return;
    }
    ExportCurrentProducts(selectedProds, "nuevo_pedido");
  }

  function handleDownloadTemplate() {
    ExportProductsTemplate();
  }

  const handleOriginalOrderExcel = (fileInput) => {
    const file = fileInput.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!acceptable.includes(ext)) {
      setAlert("Solo archivos Excel (.xlsx, .xls)");
      setIsAlert(true);
      return;
    }

    setOriginalOrderFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Skip header row
      const rows = jsonData.slice(1).filter((row) => row[0]);

      const items = rows
        .map((row) => ({
          codigoInterno: String(row[0]).trim(),
          nombreProducto: String(row[1] || "").trim(),
          cantidadSolicitada: parseInt(row[2]) || 0,
        }))
        .filter((item) => item.codigoInterno && item.cantidadSolicitada > 0);

      // Try to match with available products to get idProducto
      const itemsWithIds = items.map((item) => {
        const foundProduct = auxProducts.find(
          (p) => String(p.codInterno) === item.codigoInterno,
        );
        return {
          ...item,
          idProducto: foundProduct?.idProducto || null,
        };
      });

      setOriginalOrderItems(itemsWithIds);
    };
    reader.readAsBinaryString(file);
  };

  const clearOriginalOrder = () => {
    setOriginalOrderItems([]);
    setOriginalOrderFile(null);
    if (originalFileRef.current) originalFileRef.current.value = "";
  };

  return (
    <div>
      <div className="formLabel">{`Registro de pedidos ${wholeName}`}</div>
      <Modal show={isAlert} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Mensaje del Sistema</Modal.Title>
        </Modal.Header>
        <Modal.Body>{alert}</Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleClose}>
            Confirmo, cerrar Mensaje del Sistema
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={isAlertSec}>
        <Modal.Header closeButton>
          <Modal.Title>{alertSec}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Image src={loading2} style={{ width: "5%" }} />
        </Modal.Body>
      </Modal>
      <Modal show={isQuantity}>
        <Modal.Header className="modalHeader">INGRESE CANTIDAD</Modal.Header>
        <Modal.Body>
          <div className="productModal">{currentProd.nombreProducto}</div>
          <Form>
            <Form.Control
              type="text"
              onChange={(e) =>
                !isNaN(e.target.value) && setModalQuantity(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" ? changeQuantitiesModal(e) : null
              }
              ref={quantref}
              value={modalQuantity}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button variant="success" onClick={(e) => changeQuantitiesModal(e)}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
      {discModal && (
        <Modal show={discModal} size="xl">
          <Modal.Header className="modalTitle">
            <Modal.Title>{`Descuentos por monto`}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {discModalType ? (
              <div>
                <ComplexDiscountTable
                  tradicionales={tradicionales}
                  pascua={pascua}
                  navidad={navidad}
                  halloween={halloween}
                  tradObject={tradObject}
                  pasObject={pasObject}
                  navObject={navObject}
                  hallObject={hallObject}
                  sinDescObject={sinDescObject}
                  espObject={espObject}
                  sinDesc={sinDesc}
                  galletones={meetsExactGalletonCondition}
                  descuentoTotal={descuentoTotal}
                />
                <SpecialsTable
                  especiales={especiales}
                  totales={descSimple}
                  isEsp={isSpecial}
                />

                {showWarningGalletones && <WarningGelletones />}
                {showSinDescTable && <SinDescTable sindDesc={sinDesc} />}
              </div>
            ) : !isSeasonalModal ? (
              <div>
                <SimpleDiscountTable
                  totales={descSimple}
                  galletones={meetsExactGalletonCondition}
                  descuentoTotal={descuentoTotal}
                />

                {showWarningGalletones && <WarningGelletones />}
                {showSinDescTable && (
                  <SinDescTable sindDesc={descSimple.productosSinDescuento} />
                )}
              </div>
            ) : (
              <div>
                <SeasonalDiscountTable
                  seasonal={seasonalProds}
                  sinDesc={seasonalSinDesc}
                  totales={seasonalTotals}
                  descuentoTotal={descuentoTotal}
                />
                <SpecialsTable
                  especiales={seasonalSpecial}
                  isSeasonalEsp={seasonalTotals.isDescEsp}
                />
                {showWarningGalletones && <WarningGelletones />}
                {showSinDescTable && <SinDescTable sindDesc={sinDesc} />}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="modalTitle">
            <Button variant="success" onClick={() => validateAvailability()}>
              Cargar Pedido
            </Button>
            <Button variant="danger" onClick={() => cancelDiscounts()}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <Form className="d-flex">
        <Form.Control
          type="search"
          placeholder="Buscar cliente por nit o razon social"
          className="me-2"
          aria-label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? searchClient(e) : null)}
        />
        <Button
          variant="warning"
          className="search"
          onClick={(e) => searchClient(e)}
        >
          {isLoading ? (
            <Image src={loading2} style={{ width: "5%" }} />
          ) : search.length < 1 ? (
            "Buscar todos"
          ) : (
            "Buscar"
          )}
        </Button>
      </Form>
      {isClient ? (
        <div className="tableOne">
          <Table>
            <thead>
              <tr className="tableHeader">
                <th className="tableColumnSmall"></th>
                <th className="tableColumnSmall">Nit</th>
                <th className="tableColumn">Razon Social</th>
                <th className="tableColumn">Zona</th>
                <th className="tableColumn">Frecuencia</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((client, index) => {
                return (
                  <tr key={index} className="tableRow">
                    <td className="tableColumnSmall">
                      <div>
                        <Button
                          variant="warning"
                          className="tableButtonAlt"
                          disabled={isSelected}
                          onClick={() => {
                            filterSelectedClient(client?.idCliente);
                          }}
                        >
                          {isSelected ? "Seleccionado" : "Seleccionar"}
                        </Button>
                      </div>
                    </td>
                    <td className="tableColumnSmall">{client?.nit}</td>
                    <td className="tableColumn">{client?.razonSocial}</td>
                    <td className="tableColumn">{client?.zona}</td>
                    <td className="tableColumn">{client?.dias}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : null}

      {/* SELECCION DE SALA PARA SUPERMERCADOS */}
      {isSelected && clientes[0]?.issuper === 1 && (
        <div
          style={{
            marginTop: "15px",
            marginBottom: "15px",
            border: "1px solid #6f42c1",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: "#6f42c1",
              color: "white",
              padding: "10px 15px",
              fontWeight: "bold",
            }}
          >
            Seleccionar Sala de Supermercado
          </div>
          <div style={{ padding: "15px" }}>
            <p
              style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}
            >
              Selecciona la sala donde se entregara el pedido
            </p>
            <Form.Select
              value={selectedSala}
              onChange={(e) => setSelectedSala(e.target.value)}
              style={{ maxWidth: "400px" }}
            >
              <option value="">-- Seleccionar Sala --</option>
              <optgroup label="La Paz (LPZ)">
                {salasList
                  .filter((s) => s.department === "LPZ")
                  .map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Cochabamba (CBBA)">
                {salasList
                  .filter((s) => s.department === "CBBA")
                  .map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Oruro (OR)">
                {salasList
                  .filter((s) => s.department === "OR")
                  .map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            </Form.Select>
            {selectedSala && (
              <div style={{ marginTop: "10px" }}>
                <span
                  style={{
                    backgroundColor: "#6f42c1",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  Sala seleccionada: {selectedSala}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PEDIDO ORIGINAL DEL CLIENTE */}
      {isSelected && (
        <div
          style={{
            marginTop: "15px",
            marginBottom: "15px",
            border: "1px solid #17a2b8",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              backgroundColor: "#17a2b8",
              color: "white",
              padding: "10px 15px",
              fontWeight: "bold",
            }}
          >
            Pedido Original del Cliente (Opcional)
          </div>
          <div style={{ padding: "15px" }}>
            <p
              style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}
            >
              Sube el Excel del pedido original para comparar despues con lo
              entregado. El formato debe tener las columnas: CODINTERNO,
              NOMBREPRODUCTO, CANTIDAD
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="file"
                ref={originalFileRef}
                accept=".xlsx,.xls"
                onChange={handleOriginalOrderExcel}
                className="form-control"
                style={{ maxWidth: "300px" }}
              />
              {originalOrderItems.length > 0 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={clearOriginalOrder}
                >
                  Limpiar
                </Button>
              )}
            </div>

            {originalOrderItems.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <span
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {originalOrderItems.length} productos cargados
                </span>
                <div
                  style={{
                    maxHeight: "200px",
                    overflow: "auto",
                    marginTop: "10px",
                  }}
                >
                  <Table size="sm" bordered>
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Encontrado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {originalOrderItems.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.codigoInterno}</td>
                          <td>{item.nombreProducto}</td>
                          <td>{item.cantidadSolicitada}</td>
                          <td
                            style={{
                              color: item.idProducto ? "green" : "orange",
                            }}
                          >
                            {item.idProducto ? "Si" : "No"}
                          </td>
                        </tr>
                      ))}
                      {originalOrderItems.length > 10 && (
                        <tr>
                          <td
                            colSpan={4}
                            style={{ textAlign: "center", color: "#666" }}
                          >
                            ... y {originalOrderItems.length - 10} mas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="formLabelPurple"></div>
      <div className="formLabel">SELECCIONE PRODUCTO</div>
      <div className="rowFormInputs">
        <Form className="mb-3 halfSelect">
          <Form.Group controlId="order">
            <Form.Select
              className="selectorColor"
              onChange={(e) => selectProduct(e.target.value)}
              ref={searchRef}
            >
              <option>Seleccione producto</option>

              {available.map((producto) => {
                return (
                  <option
                    value={JSON.stringify(producto)}
                    key={producto.idProducto}
                  >
                    {producto.nombreProducto}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </Form>

        <Form className="mb-3 searchHalf" onSubmit={(e) => addWithScanner(e)}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Buscar"
              value={filtered}
              onChange={(e) => filterProducts(e.target.value)}
            ></Form.Control>
          </Form.Group>
        </Form>
      </div>
      <div className="secondHalf" style={{ marginBottom: "20px" }}>
        <div className="formLabel">CARGA MASIVA DE PRODUCTOS</div>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? "2px dashed #007bff" : "2px dashed #ccc",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
            backgroundColor: isDragging ? "#e7f3ff" : "#f9f9f9",
            cursor: "pointer",
            marginBottom: "10px",
            transition: "all 0.3s ease",
            transition: "all 0.3s ease",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleExcelUpload(e)}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          <div style={{ fontSize: "16px", color: "#666" }}>
            {isDragging
              ? "Suelte el archivo aquí"
              : "Arrastre un archivo Excel aquí o haga clic para seleccionar"}
            {isDragging
              ? "Suelte el archivo aquí"
              : "Arrastre un archivo Excel aquí o haga clic para seleccionar"}
          </div>
          <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
            (Reemplazará los productos actuales)
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button variant="info" onClick={() => handleDownloadTemplate()}>
            Descargar Plantilla
          </Button>
          <Button
            variant="success"
            onClick={() => handleExportCurrentProducts()}
          >
            Exportar Productos
          </Button>
        </div>
      </div>

      <div>
        {[1, 13].includes(currentUsr.rol) && (
          <div
            style={{
              display: " flex",
              marginTop: "30px",
              marginBottom: "30px",
            }}
          >
            <Form.Label style={{ width: "50%" }}>TIPO DE DESCUENTO</Form.Label>{" "}
            <Form.Check
              style={{ width: "50%" }}
              onChange={() => {
                setDiscSwitch(!discSwitch);
                setDescuento(0);
              }}
              type="switch"
              value={discSwitch}
              id="custom-switch"
              label={discSwitch ? "AUTOMATICO" : "MANUAL"}
            />
          </div>
        )}
        <Form>
          <Form.Group>
            <div className="formLabel">DESCUENTO (%)</div>
            <div className="percent">
              <Form.Control
                min={0}
                max={100}
                value={descuento}
                disabled={
                  discSwitch &&
                  (tipoUsuario == 1 || tipoUsuario == 3 ? false : true)
                }
                onChange={(e) =>
                  !isNaN(e.target.value) &&
                  e.target.value < 101 &&
                  e.target.value >= 0 &&
                  handleDiscount(e.target.value)
                }
                placeholder="Ingrese porcentaje"
              ></Form.Control>
            </div>
          </Form.Group>
          {isProduct && selectedProds.length > 0 ? (
            <div className="tableOne">
              <Table>
                <thead>
                  <tr className="tableHeader">
                    <th className="smallTableColumn"></th>
                    <th className="smallTableColumn">Codigo</th>
                    <th className="smallTableColumn">Nombre</th>
                    <th className="smallTableColumn">Precio Unidad /Kg</th>
                    <th className="smallTableColumn">{`${
                      isMobile ? "Cant" : "Cantidad"
                    } /Peso (Gr)`}</th>
                    <th className="smallTableColumn">Total</th>
                    <th style={{ width: "10%" }}>
                      {isMobile ? "Cant Disp" : "Disponible"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...selectedProds].map((sp, index) => {
                    const cActual = auxProducts.find(
                      (ap) => ap.idProducto == sp.idProducto,
                    )?.cant_Actual;
                    const refActual = productRef.current.find(
                      (pr) => pr.idProducto == sp.idProducto,
                    )?.cant_Actual;
                    const isPaneton = datosPaneton.find(
                      (dp) => dp.codInterno == sp.codInterno,
                    );
                    return (
                      <tr className="tableRow" key={index}>
                        <td className="smallTableColumn">
                          <div>
                            <Button
                              onClick={() =>
                                deleteProduct(index, sp.codInterno, sp)
                              }
                              variant="warning"
                              className="tableButtonAlt"
                            >
                              {isMobile ? "X" : "Quitar"}
                            </Button>
                          </div>
                        </td>
                        <td className="smallTableColumn">{sp.codInterno}</td>
                        <td className="smallTableColumn">
                          {sp.nombreProducto}
                        </td>
                        <td style={{ width: "20%" }}>
                          {
                            <InputGroup>
                              <Form.Control
                                disabled={
                                  !(
                                    (tipoUsuario != 2 &&
                                      tipoUsuario != 6 &&
                                      tipoUsuario != 4) ||
                                    (isPaneton &&
                                      ((!isInterior &&
                                        sp.cantProducto >= 15 &&
                                        !isPaneton.isNine) ||
                                        (!isInterior &&
                                          sp.cantProducto >= 9 &&
                                          isPaneton.isNine) ||
                                        (isInterior && sp.cantProducto >= 9)))
                                  )
                                }
                                type="text"
                                value={sp.precioDeFabrica}
                                onChange={(e) =>
                                  (!isNaN(e.target.value) ||
                                    e.target.value.toString().includes(".")) &&
                                  changePrice(index, e.target.value, sp)
                                }
                              />{" "}
                              <InputGroup.Text>Bs</InputGroup.Text>
                            </InputGroup>
                          }
                        </td>
                        <td style={{ width: "20%" }}>
                          <Form.Control
                            type="text"
                            min="0"
                            placeholder="0"
                            value={sp.cantProducto}
                            onChange={(e) =>
                              !isNaN(e.target.value) &&
                              changeQuantitys(index, e.target.value, sp)
                            }
                          />
                        </td>
                        <td className="smallTableColumn">
                          {sp.totalProd?.toFixed(2)}
                        </td>
                        <td
                          style={{ color: cActual != refActual ? "red" : "" }}
                        >
                          {cActual}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="tableHeader">
                    <th className="smallTableColumn"></th>
                    <th className="smallTableColumn"></th>
                    <th className="smallTableColumn"></th>

                    <th className="smallTableColumn"></th>

                    <th className="smallTableColumn">{"Total: "}</th>
                    <th className="smallTableColumn">
                      {selectedProds
                        .reduce((accumulator, object) => {
                          return accumulator + parseFloat(object.totalProd);
                        }, 0)
                        ?.toFixed(2)}
                    </th>
                    <th className="smallTableColumn"></th>
                  </tr>
                </tfoot>
              </Table>
            </div>
          ) : null}
          {/* Input de descuento del total oculto temporalmente
          <Form.Group>
            <div className="formLabel">DESCUENTO DEL TOTAL (%)</div>
            <div className="percent">
              <Form.Control
                type="number"
                min={0}
                max={100}
                value={descuentoTotal}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) {
                    setDescuentoTotal(val);
                  }
                }}
                placeholder="Descuento sobre el total"
              ></Form.Control>
            </div>
          </Form.Group>
          */}
          <div className="formLabel">SELECCIONE TIPO PEDIDO</div>
          <Form.Group className="mb-3" controlId="order">
            <Form.Select
              className="selectorHalf"
              onChange={(e) => handleType(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="muestra">Muestra</option>
              <option value="consignacion">Consignación</option>
              {[1, 1049, 1081].includes(usuarioAct) && (
                <option value="reserva">Reserva</option>
              )}
              <option value="neteo">Neteo</option>
              <option value="cambio_directo">Cambio Directo</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <div className="comments">
              <Form.Control
                as="textarea"
                rows={4}
                onChange={(e) => {
                  setObservaciones(e.target.value);
                }}
                value={observaciones}
                placeholder="Notas adicionales"
                maxLength="250"
              ></Form.Control>
              <div>{`${250 - observaciones.length} caracteres restantes`}</div>
            </div>
          </Form.Group>
          <Form.Group>
            <div className="formLabel">CONFIRMAR PRODUCTOS</div>
            <div className="percent">
              <Button
                variant="warning"
                className="yellowLarge"
                onClick={() => validateProductLen()}
                ref={prodTableRef}
              >
                {isLoading ? (
                  <Image src={loading2} style={{ width: "5%" }} />
                ) : tipo == "normal" ? (
                  "Procesar descuentos"
                ) : (
                  `Cargar Pedido`
                )}
              </Button>
            </div>
          </Form.Group>
        </Form>
      </div>
      {isWholeModal && (
        <WholeSaleModal
          showModal={isWholeModal}
          sudoId={JSON.parse(Cookies.get("userAuth")).idUsuario}
        />
      )}
    </div>
  );
}

const WarningGelletones = () => (
  <div
    style={{
      color: "red",
      fontSize: "12px",
      marginBottom: "10px",
    }}
  >
    <p>
      Para obtener el
      <span
        style={{
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {" "}
        descuento del 8%{" "}
      </span>
      en galletones, debe seleccionar
      <span
        style={{
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {" "}
        solo un tipo
      </span>
      de GALLETON y debe ser mayor o igual a
      <span
        style={{
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {" "}
        720 unidades, solo valido para mayoristas de La Paz
      </span>
      <ul>
        {/* <li>Display Galletón Chocolate (500g/10Und)</li> */}
        <li>Galletón Chips de Chocolate (50g/10Und)</li>
        <li>GALLETON EXTRA CHIPS DE CHOCOLATE (65 g)</li>
        <li>Galletón Diet Chips de Chocolate(50g/10Und)</li>
      </ul>
    </p>
  </div>
);

/**

const tradObj = traditionalDiscounts(
        tradicionales,
        especiales,
        sinDesc,
        discountList
      );

      setIsSpecial(tradObj.especial);
      const pasObj = easterDiscounts(pascua, discountList);
      const navObj = christmassDiscounts(navidad, discountList);
      const hallObj = halloweenDiscounts(halloween, discountList);

      setTradObject(tradObj);
      setPasObject(pasObj);
      setNavObject(navObj);
      setHallObject(hallObj);
      setTotalDesc(
        (
          parseFloat(pasObj.descCalculado) +
          parseFloat(tradObj.descCalculado) +
          parseFloat(navObj.descCalculado) +
          parseFloat(hallObj.descCalculado)
        ).toFixed(2)
      );

      setTotalPrevio(
        (
          parseFloat(tradObj.total) +
          parseFloat(pasObj.total) +
          parseFloat(navObj.total) +
          parseFloat(hallObj.total)
        ).toFixed(2)
      );
      setTotalFacturar(
        (
          parseFloat(tradObj.facturar) +
          parseFloat(pasObj.facturar) +
          parseFloat(navObj.facturar) +
          parseFloat(hallObj.facturar)
        ).toFixed(2)
      );

      setDiscModalType(true);
      setDiscModal(true);
      const newArr = addProductDiscounts(
        selectedProds,
        tradObj,
        pasObj,
        navObj,
        hallObj
      );
      newArr.then((result) => {
        setSelectedProds(result);
      });



 */
2;
