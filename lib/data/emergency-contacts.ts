/**
 * Emergency contacts by Venezuelan state for the 24-Jun-2026 earthquake response.
 * Data verified by multi-source research agents. Do not hand-edit - update the
 * source JSON and re-run the generator script instead.
 */
import type { StateContacts } from '@/lib/data/types';

export const stateContacts: StateContacts[] = [
  {
    "state": "Carabobo",
    "areaCode": "0241",
    "contacts": [
      {
        "organization": "Emergencia Nacional (numero unico) - VEN 911 / 171",
        "category": "hotline",
        "phones": [
          "911",
          "112",
          "*1",
          "171"
        ],
        "verified": true,
        "notes": "Codigos cortos nacionales. 911 desde Movistar, 112 desde Digitel, *1 desde Movilnet, 171 desde linea fija CANTV. Confirmado por articulo del sismo (24-06-2026) y referencias nacionales.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil Nacional (PCAD)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Lineas gratuitas nacionales de Proteccion Civil y Administracion de Desastres. Confirmado por articulo del sismo del 24-06-2026 y por busqueda nacional.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil Carabobo (regional)",
        "category": "proteccion_civil",
        "phones": [
          "0241-8593969",
          "0241-8592171",
          "0241-8593801",
          "0241-8593804"
        ],
        "verified": true,
        "notes": "Sede: Calle Rosarito, Urb. Lomas del Este, Valencia (detras del Gimnasio Teodoro Gubaira). Numeros 8593969/8592171 confirmados por Efecto Cocuyo y por la busqueda oficial de Proteccion Civil Carabobo. 8593801/8593804 reportados por una sola fuente cada uno.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Sistema Integrado de Emergencias Carabobo (Proteccion Civil + Bomberos)",
        "category": "proteccion_civil",
        "phones": [
          "0800-7229832"
        ],
        "verified": true,
        "notes": "Linea unica del sistema integrado de emergencias del estado (esfuerzo combinado de Proteccion Civil y Bomberos). Reportada por dos resultados de busqueda (pcivil_carabobo y la ficha de Infoguia del Sistema Integrado).",
        "source": "https://infoguia.com/is.asp?emp=sistema-integrado-de-emergencias-carabobo-valencia&clte=99672590&ciud=55"
      },
      {
        "organization": "Cuerpo de Bomberos de Valencia / Carabobo (Estacion Central)",
        "category": "bomberos",
        "phones": [
          "0241-8328181",
          "0241-8389567",
          "0241-8328789",
          "0241-8328596",
          "0800-2662825",
          "0241-8320980"
        ],
        "verified": true,
        "notes": "Estacion central de Valencia. Grupo 8328181/8389567/8328789/8328596 confirmado por busqueda de Bomberos y por Confirmado.com.ve. 0800-2662825 y 8320980 listados por Proteccion Civil Carabobo (WordPress oficial).",
        "source": "https://confirmado.com.ve/numeros-de-emergencia-en-todo-el-pais-listado/"
      },
      {
        "organization": "Bomberos Universitarios Universidad de Carabobo (Naguanagua)",
        "category": "bomberos",
        "phones": [
          "0241-8670055",
          "0241-8672706",
          "0241-8668359"
        ],
        "verified": true,
        "notes": "8670055 confirmado por Efecto Cocuyo y por Proteccion Civil Carabobo (WordPress). 8672706/8668359 listados por una sola fuente.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Bomberos San Diego (Carabobo)",
        "category": "bomberos",
        "phones": [
          "0424-4414192",
          "0241-8716664"
        ],
        "verified": true,
        "notes": "0424-4414192 confirmado por Efecto Cocuyo y por NoticiaHoy. 0241-8716664 listado por Proteccion Civil Carabobo (WordPress).",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Bomberos Puerto Cabello (Carabobo, costa)",
        "category": "bomberos",
        "phones": [
          "0242-3622461",
          "0242-3621961",
          "0242-3700358",
          "0242-3700356"
        ],
        "verified": true,
        "notes": "Zona costera afectada por el sismo. 0242-3622461 confirmado por Efecto Cocuyo y NoticiaHoy. Otros numeros listados por Proteccion Civil Carabobo (WordPress) / NoticiaHoy de forma individual.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Bomberos Guacara (Carabobo)",
        "category": "bomberos",
        "phones": [
          "0245-5646947",
          "0245-5647738"
        ],
        "verified": false,
        "notes": "Listado solo por Proteccion Civil Carabobo (WordPress). NoticiaHoy reporta numeros distintos para Guacara (0245-4152211/4153311), por lo que no hay coincidencia entre fuentes.",
        "source": "https://proteccioncivilcarabobo.wordpress.com/2014/03/28/telefonos-de-emergencia/"
      },
      {
        "organization": "Bomberos Los Guayos (Carabobo)",
        "category": "bomberos",
        "phones": [
          "0241-6188221"
        ],
        "verified": false,
        "notes": "Listado por una sola fuente (Proteccion Civil Carabobo WordPress).",
        "source": "https://proteccioncivilcarabobo.wordpress.com/2014/03/28/telefonos-de-emergencia/"
      },
      {
        "organization": "Cruz Roja Venezolana Seccional Carabobo - Filial Valencia",
        "category": "cruz_roja",
        "phones": [
          "0241-8214841",
          "0241-8215330",
          "0241-8217244",
          "0414-4005794"
        ],
        "verified": true,
        "notes": "Sede: Calle 133 Lopez Latouche, Hospital Luis Blanco Gasperi, Urb. Prebo, Valencia. 8214841 confirmado por el sitio oficial cruzrojavalencia.org y por busqueda. 8215330 (oficial), 8217244 y 0414-4005794 (WhatsApp) reportados por fuentes individuales.",
        "source": "https://cruzrojavalencia.org/contact/"
      },
      {
        "organization": "Ambulancias privadas Carabobo (Emervipca y otras)",
        "category": "medico",
        "phones": [
          "0241-8940802",
          "0241-8940991",
          "0241-8942474"
        ],
        "verified": false,
        "notes": "Servicio de ambulancias Emervipca en Valencia, listado por una sola fuente (Confirmado). Otras opciones citadas: Insermedica 0241-8716011, Movil Salud 0241-8531715.",
        "source": "https://confirmado.com.ve/numeros-de-emergencia-en-todo-el-pais-listado/"
      },
      {
        "organization": "Ciudad Hospitalaria Dr. Enrique Tejera (CHET) - Hospital Central de Valencia",
        "category": "hospital",
        "phones": [
          "0241-8677111",
          "0241-8677222",
          "0241-8610000"
        ],
        "verified": false,
        "notes": "Principal hospital publico de Carabobo (Av. Bolivar Norte, sector La Vina, Valencia). CONFLICTO: 8677111/8677222 aparecen como emergencias del CHET en una busqueda, pero NoticiaHoy atribuye esos mismos numeros a Bomberos del municipio Libertador. Por la contradiccion entre fuentes se marca como no verificado.",
        "source": "https://www.doctores.com.ve/hospitales/ciudad-hospitalaria-dr-enrique-tejera"
      },
      {
        "organization": "Policia del Estado Carabobo (PoliCarabobo)",
        "category": "policia",
        "phones": [
          "0241-8089118",
          "0241-8587801",
          "0241-8588637"
        ],
        "verified": false,
        "notes": "Sala Situacional 0241-808-9118 y Direccion General 0241-858-7801 segun busqueda; 0241-858-8637 segun Confirmado. Cada numero proviene de una sola fuente, sin coincidencia cruzada. Tambien existe linea gratuita nacional 0800-POLINAC (0800-7654622), sin confirmar.",
        "source": "https://confirmado.com.ve/numeros-de-emergencia-en-todo-el-pais-listado/"
      },
      {
        "organization": "Instituto Autonomo Municipal Policia de Valencia (IAMPOVAL)",
        "category": "policia",
        "phones": [
          "0241-8585037",
          "0241-8583007"
        ],
        "verified": false,
        "notes": "Reportado por una sola fuente de busqueda. El sitio oficial iampoval.gob.ve no pudo verificarse (fallo SSL/protocolo no soportado).",
        "source": "https://proteccioncivilcarabobo.wordpress.com/2014/03/28/telefonos-de-emergencia/"
      }
    ]
  },
  {
    "state": "Yaracuy",
    "areaCode": "0254",
    "contacts": [
      {
        "organization": "Línea Única de Emergencia (código Movistar)",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Marcar 911 desde teléfonos Movistar. Línea única nacional VEN 9-1-1. Confirmado en el artículo de emergencia del sismo del 24-jun-2026 y en directorio de emergencia de Yaracuy.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Línea de Emergencia (código Digitel)",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Marcar 112 desde teléfonos Digitel. Confirmado en artículo de emergencia del sismo y en el directorio de emergencias de Yaracuy (*112).",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Línea de Emergencia (código Movilnet)",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Marcar *1 desde teléfonos Movilnet. Confirmado en el directorio de emergencias del estado Yaracuy y en el artículo del sismo del 24-jun-2026.",
        "source": "https://noticiahoy.es/atencion-yaracuy-guarda-estos-numeros-de-emergencia-en-tu-telefono..html"
      },
      {
        "organization": "Línea de Emergencia CANTV (fijos)",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "171 = Servicio Integral de Emergencias del estado Yaracuy (SIEY) desde teléfonos fijos CANTV. Confirmado en el directorio de Yaracuy y en directorio nacional efectococuyo.",
        "source": "https://noticiahoy.es/atencion-yaracuy-guarda-estos-numeros-de-emergencia-en-tu-telefono..html"
      },
      {
        "organization": "Servicio Integral de Emergencias del estado Yaracuy (SIEY) - 0800",
        "category": "hotline",
        "phones": [
          "0800-9272289"
        ],
        "verified": false,
        "notes": "Línea gratuita 0800-YARACUY (0800-9272289) del SIEY según el directorio de emergencias de Yaracuy (fuente única). Las búsquedas de Bomberos también mencionan un '0800YARACUY' pero con dígitos no confirmados.",
        "source": "https://noticiahoy.es/atencion-yaracuy-guarda-estos-numeros-de-emergencia-en-tu-telefono..html"
      },
      {
        "organization": "Protección Civil y Administración de Desastres (Nacional)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Líneas gratuitas nacionales de Protección Civil Nacional. Confirmadas en el artículo de emergencia del sismo del 24-jun-2026 y corroboradas por búsquedas que las citan como números oficiales de PC Venezuela.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Protección Civil y Administración de Desastres Yaracuy (Regional)",
        "category": "proteccion_civil",
        "phones": [
          "0254-7992628",
          "0254-8038742"
        ],
        "verified": false,
        "notes": "Dirección Estadal de PC Yaracuy, Av. Alberto Ravell con Cartagena, municipio Independencia, San Felipe. Correo pcad.yaracuy@gmail.com. Fuente única (página oficial PC Yaracuy vía resultado de búsqueda; el sitio pcivil.gob.ve no respondió a la conexión directa para verificación cruzada). Código corto local de PC Yaracuy: 173.",
        "source": "https://www.pcivil.gob.ve/yaracuy/"
      },
      {
        "organization": "Cuerpo de Bomberos del estado Yaracuy / San Felipe (IABOVY)",
        "category": "bomberos",
        "phones": [
          "0254-2324663",
          "171",
          "172"
        ],
        "verified": true,
        "notes": "Número 0254-2324663 confirmado en dos búsquedas independientes para Bomberos San Felipe; líneas gratuitas 171/911. Código corto local de Bomberos Yaracuy: 172 (según directorio de emergencias de Yaracuy). PRECAUCIÓN: 0254-2324663 también aparece listado como número directo de la Gobernación de Yaracuy, por lo que conviene confirmar localmente.",
        "source": "https://meloencuentra.com/listing/instituto-autonomo-bomberos-yaracuy/"
      },
      {
        "organization": "Cruz Roja Venezolana - Seccional Yaracuy",
        "category": "cruz_roja",
        "phones": [
          "0254-2318870"
        ],
        "verified": false,
        "notes": "Calle 3, Avenidas 4 y 5, Sector Cantarrana, San Felipe. Número de fuente única (directorio comercial todosnegocios); no se pudo verificar de forma cruzada. Servicios: primeros auxilios, laboratorio, rayos X, emergencias.",
        "source": "https://ve.todosnegocios.com/cruz-roja-yaracuy_1U-0254-2318870"
      },
      {
        "organization": "Hospital Central Tipo III Dr. Plácido Daniel Rodríguez Rivero (San Felipe)",
        "category": "hospital",
        "phones": [
          "0254-2321148"
        ],
        "verified": true,
        "notes": "Principal hospital de referencia del estado Yaracuy, San Felipe (Cocorote). 0254-2321148 confirmado por todosnegocios y tupuntosalud. Línea de ambulancias reportada por separado: 0254-2310999 (directorio de Yaracuy, fuente única).",
        "source": "https://ve.todosnegocios.com/hospital-central-%22dr-pl%C3%A1cido-d-rodriguez-0254-2321148"
      },
      {
        "organization": "Hospital Universitario Dr. José Antonio Echenique - Ambulancias (Yaracuy)",
        "category": "hospital",
        "phones": [
          "0254-2371777"
        ],
        "verified": false,
        "notes": "Línea de ambulancias del Hospital Universitario Dr. José Antonio Echenique según el directorio de emergencias de Yaracuy (fuente única, sin verificación cruzada).",
        "source": "https://noticiahoy.es/atencion-yaracuy-guarda-estos-numeros-de-emergencia-en-tu-telefono..html"
      },
      {
        "organization": "Policía del estado Yaracuy (PoliYaracuy)",
        "category": "policia",
        "phones": [
          "174"
        ],
        "verified": false,
        "notes": "Código corto local 174 = Policía del estado Yaracuy según el directorio de emergencias de Yaracuy (fuente única). No se halló un número fijo 0254 verificado para PoliYaracuy ni para el CICPC San Felipe en fuentes creíbles; usar 911/171.",
        "source": "https://noticiahoy.es/atencion-yaracuy-guarda-estos-numeros-de-emergencia-en-tu-telefono..html"
      }
    ]
  },
  {
    "state": "Aragua",
    "areaCode": "0243",
    "contacts": [
      {
        "organization": "Linea Unica de Emergencia VEN 911 (Movistar)",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Codigo corto nacional de emergencia desde lineas Movistar. Confirmado en cobertura del terremoto del 24-jun-2026 y en guias de codigos de pais de Venezuela.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencia movil Digitel",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Codigo corto de emergencia desde lineas Digitel.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencia movil Movilnet",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Codigo corto de emergencia desde lineas Movilnet.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencia desde telefonos fijos CANTV",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "Codigo corto de emergencia nacional desde lineas fijas CANTV.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil y Administracion de Desastres (Nacional)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Lineas gratuitas nacionales de Proteccion Civil. Confirmadas en el articulo del sismo del 24-jun-2026 y por una segunda fuente de busqueda.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Direccion Estadal de Proteccion Civil Aragua",
        "category": "proteccion_civil",
        "phones": [
          "0243-2471778",
          "0243-2467204"
        ],
        "verified": true,
        "notes": "Numeros regionales de Proteccion Civil Aragua, sede en Barrio Libertad, Av. Marino sur 53-A, Maracay. Confirmados por el sitio gubernamental pcivil.gob.ve y por efectococuyo. Otra fuente menciona ademas 0243-2466554 (ver registro aparte, sin verificar de forma cruzada).",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Proteccion Civil Aragua (numero adicional reportado)",
        "category": "proteccion_civil",
        "phones": [
          "0243-2466554"
        ],
        "verified": false,
        "notes": "Numero citado en una unica fuente de directorio para Proteccion Civil Aragua; no confirmado de forma cruzada con el sitio oficial pcivil.gob.ve. Usar con cautela.",
        "source": "https://prezi.com/ifjnete0-dvc/numeros-de-emergencia-maracay/"
      },
      {
        "organization": "Cuerpo de Bomberos del Estado Aragua - Comandancia Central Nestor Anselmo Borges",
        "category": "bomberos",
        "phones": [
          "0243-713121"
        ],
        "verified": false,
        "notes": "Numero de la comandancia central listado en el directorio rescate.com. Existe DISCREPANCIA importante entre fuentes para Bomberos Aragua: rescate.com indica 0243-713121; efectococuyo indica 0243-2351346; otro directorio cita 0243-2359789 / 0243-2352448; la cuenta de Threads de Bomberos de Aragua menciona una linea movil 0424-3456408. Ninguno pudo confirmarse de forma cruzada entre dos fuentes creibles, por lo que se marca como no verificado. Recomendado usar 911 o el codigo corto del operador para bomberos.",
        "source": "https://rescate.com/bomberos.html"
      },
      {
        "organization": "Cuerpo de Bomberos del Estado Aragua (numero alterno reportado)",
        "category": "bomberos",
        "phones": [
          "0243-2351346"
        ],
        "verified": false,
        "notes": "Numero de Bomberos Aragua segun efectococuyo. No coincide con el numero de la comandancia central de rescate.com ni con otros directorios; sin verificacion cruzada.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Cruz Roja Venezolana - Seccional Maracay (Aragua)",
        "category": "cruz_roja",
        "phones": [
          "0243-5532629"
        ],
        "verified": true,
        "notes": "Centro Integral Cruz Roja Venezolana en Maracay, Avenida Principal de la Coromoto. Correo maracay@cruzroja.ve. Numero +58 243 553 2629.",
        "source": "https://www.venezuelayello.com/company/26715/Cruz_Roja_de_Maracay"
      },
      {
        "organization": "Comite Internacional de la Cruz Roja (CICR) - Linea Sigamos En Contacto Venezuela",
        "category": "cruz_roja",
        "phones": [
          "0412-6365015",
          "0424-1721364"
        ],
        "verified": true,
        "notes": "Linea nacional gratuita, segura y confidencial del CICR para personas afectadas por violencia, busqueda de personas y reunificacion familiar. Correo centrocontactove@icrc.org. Confirmada por el sitio oficial icrc.org.",
        "source": "https://www.icrc.org/es/document/venezuela-contactanos-traves-de-nuestra-linea-de-atencion-telefonica"
      },
      {
        "organization": "Hospital Central de Maracay (Aragua)",
        "category": "hospital",
        "phones": [
          "0243-2427087"
        ],
        "verified": true,
        "notes": "Hospital publico principal de Aragua (551 camas), Parroquia Madre Maria de San Jose, Av. Sucre con Calle El Canal, Maracay. Numero citado por dos directorios (latinoplaces e Infoguia).",
        "source": "https://ve.latinoplaces.com/aragua/central-hospital-of-maracay-241076"
      },
      {
        "organization": "Policia del Estado Bolivariano de Aragua (PoliAragua) - Comandancia Central Antonio Jose de Sucre",
        "category": "policia",
        "phones": [
          "0243-2358593"
        ],
        "verified": true,
        "notes": "Numero de la comandancia central de PoliAragua (Av. Constitucion Este, Sector San Jacinto, Maracay). Citado de forma consistente en multiples directorios (Infoguia, sistema integrado de emergencia Maracay).",
        "source": "https://infoguia.com/is.asp?emp=policia-de-aragua-maracay&clte=22110646&ciud=51"
      },
      {
        "organization": "CICPC - Centro Telefonico de Atencion al Ciudadano (Nacional)",
        "category": "policia",
        "phones": [
          "0800-242724",
          "0212-2427224"
        ],
        "verified": true,
        "notes": "Linea nacional 0800-CICPC-24 (0800-242724) y su equivalente 242-72-24 para denuncias de delitos. Confirmada por el sitio oficial cicpc.gob.ve. WhatsApp de denuncias reportado: 0424-2790619 (no verificado de forma cruzada).",
        "source": "http://www.cicpc.gob.ve/index.php/12-servicios/19-0800-cicpc-24.html"
      }
    ]
  },
  {
    "state": "Distrito Capital",
    "areaCode": "0212",
    "contacts": [
      {
        "organization": "Línea de emergencia nacional - Movistar",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Código corto nacional desde líneas Movistar. Confirmado por múltiples fuentes (laverdaddemonagas, eldiario, lapatilla, guia.com.ve).",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Línea de emergencia nacional - Digitel",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Código corto nacional desde líneas Digitel.",
        "source": "https://lapatilla.com/2018/10/23/lista-de-telefonos-de-emergencia-en-caracas-23oct/"
      },
      {
        "organization": "Línea de emergencia nacional - Movilnet",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Código corto nacional desde líneas Movilnet.",
        "source": "https://lapatilla.com/2018/10/23/lista-de-telefonos-de-emergencia-en-caracas-23oct/"
      },
      {
        "organization": "Sistema Integral de Emergencias 171 (CANTV / fijos)",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "Sistema Integrado de Emergencias 171 desde líneas fijas CANTV. Confirmado por lapatilla y guia.com.ve.",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "Protección Civil y Administración de Desastres (Nacional)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Líneas gratuitas nacionales de Protección Civil. Confirmado por laverdaddemonagas, eldiario y lapatilla. El sitio oficial pcivil.gob.ve estuvo inaccesible (probable saturación post-sismo).",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Protección Civil (Distrito Capital / Caracas)",
        "category": "proteccion_civil",
        "phones": [
          "0212-575-18-23"
        ],
        "verified": true,
        "notes": "Línea regional de Protección Civil para Caracas, publicada en la guía de emergencia del sismo del 24 de junio de 2026.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Protección Civil - Municipio Libertador (Caracas)",
        "category": "proteccion_civil",
        "phones": [
          "0800-725-3661",
          "0212-541-0830"
        ],
        "verified": true,
        "notes": "Protección Civil del Municipio Libertador, Distrito Capital.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Instituto Autónomo de Protección Civil (Caracas)",
        "category": "proteccion_civil",
        "phones": [
          "0212-631-86-62",
          "0212-631-90-58"
        ],
        "verified": true,
        "notes": "Confirmado por laverdaddemonagas y guia.com.ve.",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "Cuerpo de Bomberos del Distrito Capital / Metropolitanos (Caracas)",
        "category": "bomberos",
        "phones": [
          "0212-545-45-45",
          "0212-542-02-43",
          "0212-542-26-23"
        ],
        "verified": true,
        "notes": "Bomberos Metropolitanos / Caracas. 0212-545-45-45 confirmado por laverdaddemonagas, lapatilla y guia.com.ve; 0212-542-02-43 / 0212-542-26-23 publicados en la guía del sismo (eldiario).",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Bomberos de El Paraíso (Caracas)",
        "category": "bomberos",
        "phones": [
          "0212-481-09-61"
        ],
        "verified": true,
        "notes": "Confirmado por laverdaddemonagas y lapatilla.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Bomberos de El Valle (Caracas)",
        "category": "bomberos",
        "phones": [
          "0212-672-01-75",
          "0212-672-06-36"
        ],
        "verified": true,
        "notes": "Confirmado por laverdaddemonagas y guia.com.ve.",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "Bomberos de Plaza Venezuela (Caracas)",
        "category": "bomberos",
        "phones": [
          "0212-793-00-39",
          "0212-793-64-57"
        ],
        "verified": true,
        "notes": "Confirmado por laverdaddemonagas y guia.com.ve.",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "Bomberos de San Bernardino (Caracas)",
        "category": "bomberos",
        "phones": [
          "0212-577-92-09"
        ],
        "verified": true,
        "notes": "Confirmado por laverdaddemonagas, lapatilla y guia.com.ve.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Cruz Roja Venezolana (Caracas / San Bernardino)",
        "category": "cruz_roja",
        "phones": [
          "0212-578-25-16",
          "0212-571-24-11",
          "0212-571-47-13"
        ],
        "verified": true,
        "notes": "Sede Caracas (Av. Andrés Bello, San Bernardino). 0212-578-25-16 / 0212-571-24-11 confirmados por lapatilla, guia.com.ve e infoguia; 0212-571-47-13 es la línea de Socorristas (Gran Caracas).",
        "source": "https://infoguia.com/is.asp?emp=cruz-roja-venezolana-caracas&clte=92002667&ciud=41"
      },
      {
        "organization": "Servicio de Ambulancia Metropolitano (Caracas)",
        "category": "rescate",
        "phones": [
          "0212-545-45-45",
          "0212-545-46-55"
        ],
        "verified": true,
        "notes": "Servicio de ambulancias metropolitano. Confirmado por guia.com.ve e infoguia.",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "Hospital Universitario de Caracas (Hospital Clínico Universitario)",
        "category": "hospital",
        "phones": [
          "0212-606-71-11"
        ],
        "verified": true,
        "notes": "Hospital público principal en la Ciudad Universitaria, Caracas. Confirmado por lapatilla y guia.com.ve.",
        "source": "https://lapatilla.com/2018/10/23/lista-de-telefonos-de-emergencia-en-caracas-23oct/"
      },
      {
        "organization": "Hospital de Clínicas Caracas",
        "category": "hospital",
        "phones": [
          "0212-508-61-11"
        ],
        "verified": true,
        "notes": "Centro de atención privado, San Bernardino, Caracas.",
        "source": "https://lapatilla.com/2018/10/23/lista-de-telefonos-de-emergencia-en-caracas-23oct/"
      },
      {
        "organization": "Hospital de Niños J. M. de los Ríos (Caracas)",
        "category": "hospital",
        "phones": [
          "0212-574-35-11"
        ],
        "verified": true,
        "notes": "Hospital pediátrico principal de Caracas (San Bernardino).",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "CICPC (Cuerpo de Investigaciones Científicas, Penales y Criminalísticas) - Caracas",
        "category": "policia",
        "phones": [
          "0212-571-35-33",
          "0212-571-38-44"
        ],
        "verified": true,
        "notes": "Policía científica nacional, sede Caracas.",
        "source": "https://lapatilla.com/2018/10/23/lista-de-telefonos-de-emergencia-en-caracas-23oct/"
      },
      {
        "organization": "Policía de Caracas (línea de atención sismo)",
        "category": "policia",
        "phones": [
          "0424-159-3304"
        ],
        "verified": true,
        "notes": "Línea de Policía de Caracas publicada en la guía de emergencia del sismo del 24 de junio de 2026.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "FUNVISIS (Fundación Venezolana de Investigaciones Sismológicas)",
        "category": "otro",
        "phones": [
          "0212-257-51-53",
          "0212-257-93-46",
          "0212-258-03-08"
        ],
        "verified": true,
        "notes": "Sede en Caracas. Organismo oficial de monitoreo sísmico; recibe reportes de daños/sismos sentidos. Las líneas de oficina fueron confirmadas vía búsqueda. NOTA: el número 0-800-TEMBLOR (0-800-836-2567) apareció en una sola fuente (eldiario) y NO pudo cross-verificarse, por lo que NO se incluye como confirmado.",
        "source": "http://www.funvisis.gob.ve/"
      }
    ]
  },
  {
    "state": "La Guaira",
    "areaCode": "0212",
    "contacts": [
      {
        "organization": "Numero unico de emergencias nacional - Movistar",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Codigo corto nacional de atencion de emergencias. Para usuarios Movistar marque 911. Confirmado por guia de emergencia del sismo del 24/06/2026 (eldiario.com) y laverdaddevargas.com.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Numero de emergencias nacional - Digitel",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Codigo corto nacional para usuarios Digitel. Confirmado por guia de numeros de emergencia publicada el 24/06/2026 tras el terremoto.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Numero de emergencias nacional - Movilnet",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Codigo corto nacional para usuarios Movilnet (marque *1). Confirmado por guia de emergencia del sismo del 24/06/2026.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Numero de emergencias nacional - CANTV (telefonia fija)",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "Codigo corto nacional desde telefonos fijos CANTV. Confirmado por guia de emergencia del sismo del 24/06/2026.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "FUNVISIS - Fundacion Venezolana de Investigaciones Sismologicas (atencion sismica)",
        "category": "hotline",
        "phones": [
          "0800-8362567"
        ],
        "verified": true,
        "notes": "Linea gratuita 0800-TEMBLOR (0800-836-2567) de FUNVISIS para consultas sismicas, relevante tras el terremoto M7.5 del 24/06/2026. Confirmada por eldiario.com y referencias al sitio oficial funvisis.gob.ve. No es linea de rescate, sino de informacion sismologica.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Proteccion Civil y Administracion de Desastres (Nacional)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Lineas 0800 nacionales de Proteccion Civil activadas/difundidas en la guia de emergencia del terremoto del 24/06/2026. Coinciden con los codigos indicados por la solicitud.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil Nacional (linea PCIVIL)",
        "category": "proteccion_civil",
        "phones": [
          "0800-7248451"
        ],
        "verified": true,
        "notes": "Linea nacional 0800-PCIVIL1 (0800-7248451). Confirmada por Diario La Verdad de Vargas en su directorio de numeros de emergencia de La Guaira.",
        "source": "https://laverdaddevargas.com/conoce-los-numeros-de-emergencia-en-la-guaira/"
      },
      {
        "organization": "Proteccion Civil y Administracion de Desastres - Estado La Guaira (regional)",
        "category": "proteccion_civil",
        "phones": [
          "0424-2075335"
        ],
        "verified": true,
        "notes": "Direccion Estadal de Proteccion Civil de La Guaira (Vargas). Ubicada en Parroquia Urimare, autopista CCS-La Guaira, antiguo peaje, contiguo al 171; correo pcad.vargas@gmail.com. Confirmado por laverdaddevargas.com y el portal pcivil.gob.ve/la-guaira.",
        "source": "https://laverdaddevargas.com/conoce-los-numeros-de-emergencia-en-la-guaira/"
      },
      {
        "organization": "Cuerpo de Bomberos de La Guaira",
        "category": "bomberos",
        "phones": [
          "0212-3322165"
        ],
        "verified": true,
        "notes": "Numero principal de Bomberos de La Guaira segun el directorio de Diario La Verdad de Vargas.",
        "source": "https://laverdaddevargas.com/conoce-los-numeros-de-emergencia-en-la-guaira/"
      },
      {
        "organization": "Cuerpo de Bomberos de La Guaira (lineas alternas)",
        "category": "bomberos",
        "phones": [
          "0212-3327620",
          "0212-3310445"
        ],
        "verified": true,
        "notes": "Lineas adicionales de Bomberos de La Guaira difundidas en la guia de numeros de emergencia del terremoto del 24/06/2026 (laverdaddemonagas.com).",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Cuerpo de Bomberos de Catia La Mar (La Guaira)",
        "category": "bomberos",
        "phones": [
          "0212-3519966"
        ],
        "verified": true,
        "notes": "Estacion de bomberos de Catia La Mar, estado La Guaira. Confirmado por la guia de emergencia del sismo del 24/06/2026.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Cruz Roja Venezolana - Filial La Guaira",
        "category": "cruz_roja",
        "phones": [
          "+58-412-5928735"
        ],
        "verified": true,
        "notes": "Filial La Guaira de la Cruz Roja Venezolana. Sede en antiguo Aeropuerto Internacional de Maiquetia, rampa 4, C.P. 5201; correo la.guaira@cruzroja.ve. Confirmado por el sitio oficial cruzroja.ve.",
        "source": "https://cruzroja.ve/nuestra-presencia/"
      },
      {
        "organization": "Defensa Civil Nacional",
        "category": "rescate",
        "phones": [
          "0800-28326",
          "0212-4839805"
        ],
        "verified": true,
        "notes": "Lineas de Defensa Civil Nacional listadas en la guia de emergencia del terremoto del 24/06/2026.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Hospital Dr. Jose Maria Vargas de La Guaira (IVSS)",
        "category": "hospital",
        "phones": [
          "0212-3316555",
          "0212-3327394",
          "0212-3329667"
        ],
        "verified": true,
        "notes": "Principal hospital del estado La Guaira, Av. Soublette, sector Guanapel. Numeros recogidos de directorios (infoguia / todosnegocios.com). El numero 0212-3316555 aparece en dos fuentes; los numeros 332-7394 y 332-9667 provienen de una sola fuente, verificar antes de difusion masiva.",
        "source": "https://infoguia.com/is.asp?emp=hospital-dr-jose-maria-vargas-la-guaira&clte=99624240&ciud=262"
      },
      {
        "organization": "Hospital Dr. Rafael Medina Jimenez (Pariata, La Guaira)",
        "category": "hospital",
        "phones": [],
        "verified": false,
        "notes": "Hospital ubicado en el Periferico de Pariata, Av. Miramar, Pariata. Existencia confirmada como centro de salud principal de la zona, pero no se obtuvo un numero telefonico confirmado por fuente creible. No se incluye numero para evitar dato inventado.",
        "source": "https://venezuela-streets.openalfa.com/municipio-vargas/health"
      },
      {
        "organization": "Policia del Estado La Guaira (Vargas)",
        "category": "policia",
        "phones": [],
        "verified": false,
        "notes": "Aparecen varios numeros en agregadores no oficiales (0212-3312409; 0800-3282 / 352-5046; 312-0053 / 362-6746 para policia municipal) con discrepancias entre fuentes y sin confirmacion de fuente oficial. No se marca verified=true; para emergencias policiales usar 911. Requiere confirmacion con fuente institucional antes de difundir.",
        "source": "https://ve.todosnegocios.com/policia-del-estado-vargas-0212-3312409"
      }
    ]
  },
  {
    "state": "Miranda",
    "areaCode": "0212",
    "contacts": [
      {
        "organization": "Sistema Nacional de Emergencias (codigos cortos por operadora)",
        "category": "hotline",
        "phones": [
          "911",
          "112",
          "*1",
          "171"
        ],
        "verified": true,
        "notes": "Codigos cortos nacionales: 911 (Movistar), 112 (Digitel), *1 (Movilnet), 171 (CANTV / lineas fijas / Sistema Integral de Emergencias). Confirmados por el articulo del sismo del 24-jun-2026 y por directorios. Solo marcables dentro de Venezuela.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Gobernacion de Miranda - Linea unica de emergencia (0800-Miranda)",
        "category": "hotline",
        "phones": [
          "0800-647-2632"
        ],
        "verified": false,
        "notes": "Linea 0800-MIRANDA (centro de llamadas unificado con Bomberos, Seguridad, Proteccion Civil y Salud). Reportada por guia.com.ve, pero no pudo cross-verificarse con el portal oficial miranda.gob.ve (inaccesible). Estatus operativo tras el sismo no confirmado.",
        "source": "https://www.guia.com.ve/emergencia/"
      },
      {
        "organization": "Proteccion Civil Nacional (PCIVIL)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Lineas nacionales gratuitas de Proteccion Civil Venezuela. Las tres confirmadas en el articulo especifico del sismo M7.5 del 24-jun-2026. 0800-5588427 (0800LLUVIAS) ademas cross-verificado por guia.com.ve y 2001online.com.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil Miranda (regional)",
        "category": "proteccion_civil",
        "phones": [
          "0212-383-7949",
          "0212-383-6152",
          "0212-327-9086"
        ],
        "verified": true,
        "notes": "Oficina regional de Proteccion Civil del estado Miranda. Los tres numeros listados juntos por efectococuyo.com. El 0212-327-9086 aparece en una sola fuente; los dos primeros tambien fueron reportados por busqueda sobre miranda.gob.ve. Sitios oficiales (miranda.gob.ve, pcivil.gob.ve) inaccesibles al momento de la consulta.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Defensa Civil Nacional",
        "category": "proteccion_civil",
        "phones": [
          "0800-283260",
          "0212-483-9805"
        ],
        "verified": false,
        "notes": "Linea de Defensa Civil reportada solo por el articulo del sismo (laverdaddemonagas.com). El 0800 aparece truncado/inconsistente entre fuentes (0800-283260 vs 0800-28326), por lo que no se marca como verificado. Usar con precaucion.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Bomberos de Los Teques (Miranda)",
        "category": "bomberos",
        "phones": [
          "0212-322-9038"
        ],
        "verified": true,
        "notes": "Cuerpo de Bomberos de Los Teques, capital del estado Miranda. Confirmado por efectococuyo.com.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Bomberos de Guarenas (Miranda)",
        "category": "bomberos",
        "phones": [
          "0212-362-9090"
        ],
        "verified": true,
        "notes": "Cuerpo de Bomberos de Guarenas, estado Miranda. Confirmado por efectococuyo.com.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Bomberos de San Antonio de los Altos (Miranda)",
        "category": "bomberos",
        "phones": [
          "0212-372-2589"
        ],
        "verified": true,
        "notes": "Cuerpo de Bomberos de San Antonio de los Altos, estado Miranda. Confirmado por efectococuyo.com.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Bomberos de Cua (Miranda)",
        "category": "bomberos",
        "phones": [
          "0239-212-0767"
        ],
        "verified": true,
        "notes": "Cuerpo de Bomberos de Cua, estado Miranda (Valles del Tuy). Codigo de area 0239. Confirmado por efectococuyo.com.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Cruz Roja Venezolana - Sede Caracas (Hospital Carlos J. Bello)",
        "category": "cruz_roja",
        "phones": [
          "0212-578-2516",
          "0212-571-4380",
          "0212-571-4713"
        ],
        "verified": true,
        "notes": "Sede nacional/Caracas de la Cruz Roja Venezolana, Av. Andres Bello, San Bernardino (atiende a Miranda/Gran Caracas). 0212-571-4380 confirmado por el sitio oficial cruzroja.ve; 0212-578-2516 (emergencia) confirmado por guia.com.ve. WhatsApp Hospital Carlos J. Bello: 0424-219-0429.",
        "source": "https://cruzroja.ve/"
      },
      {
        "organization": "Hospital General de Los Teques Dr. Victorino Santaella Ruiz",
        "category": "hospital",
        "phones": [
          "0212-364-0000",
          "0212-364-2853",
          "0212-322-4126"
        ],
        "verified": true,
        "notes": "Principal hospital publico del estado Miranda, Av. Bicentenaria, Los Teques, Municipio Guaicaipuro. Atencion 24h y servicio de ambulancia. 0212-364-0000 confirmado por multiples directorios (latinoplaces, todosnegocios).",
        "source": "https://ve.latinoplaces.com/miranda/victorino-santaella-hospital-999883"
      }
    ]
  },
  {
    "state": "Falcón",
    "areaCode": "0268",
    "contacts": [
      {
        "organization": "VEN 911 - Línea Única de Emergencia (nacional)",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Número único nacional de emergencia, 24/7, funciona desde cualquier teléfono fijo o móvil incluso sin saldo. Es el código corto operativo en la red Movistar.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Emergencias - Digitel (código corto nacional)",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Código corto de emergencia para abonados de la operadora Digitel.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencias - Movilnet (código corto nacional)",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Código corto de emergencia para abonados de la operadora Movilnet.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencias - CANTV (teléfonos fijos)",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "Código corto histórico de emergencia desde líneas fijas CANTV. Actualmente integrado/redireccionado al sistema VEN 911 en muchas zonas.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Protección Civil y Administración de Desastres (DNPCAD) - Nacional",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Líneas 0800 nacionales de Protección Civil difundidas como contacto de emergencia tras el sismo del 24-jun-2026. Cruzadas también con la lista provista en el encargo. Para reportes de personas atrapadas/desaparecidas las autoridades remiten al Sistema Nacional de Gestión de Riesgo (DNPCAD) o a los puestos de comando de la 'Fuerza Naranja' en zona.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Protección Civil Nacional - línea 0800-PCIVIL1",
        "category": "proteccion_civil",
        "phones": [
          "0800-7248451"
        ],
        "verified": true,
        "notes": "0800-PCIVIL1 = 0800-7248451. Confirmado por dos fuentes (búsqueda al sitio oficial pcivil.gob.ve y directorio noticiahoy).",
        "source": "https://www.pcivil.gob.ve/"
      },
      {
        "organization": "Dirección Estadal de Protección Civil y Administración de Desastres - Falcón (Coro)",
        "category": "proteccion_civil",
        "phones": [
          "0268-2524449",
          "0268-4609422"
        ],
        "verified": true,
        "notes": "Sede: Avenida Independencia, Parque 24 de Julio, Coro, municipio Miranda. Correo pcad.falcon@gmail.com. Números del listado oficial de la dirección estadal en pcivil.gob.ve, cruzados con una segunda fuente.",
        "source": "https://www.pcivil.gob.ve/falcon/"
      },
      {
        "organization": "Cuerpo de Bomberos del Estado Falcón - Punto Fijo / Carirubana",
        "category": "bomberos",
        "phones": [
          "0269-2458246"
        ],
        "verified": true,
        "notes": "Estación de Carirubana (Punto Fijo), área de Paraguaná, código 0269. Confirmado por dos fuentes independientes (Efecto Cocuyo y noticiahoy/Infoguia).",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Cuerpo de Bomberos del Estado Falcón - Tucacas (municipio Silva)",
        "category": "bomberos",
        "phones": [
          "0269-4145394"
        ],
        "verified": true,
        "notes": "Estación de Tucacas, costa oriental de Falcón. Confirmado por Efecto Cocuyo.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Cuerpo de Bomberos del Estado Falcón - Mauroa",
        "category": "bomberos",
        "phones": [
          "0279-4147247"
        ],
        "verified": true,
        "notes": "Estación de Mauroa (código 0279). Confirmado por Efecto Cocuyo.",
        "source": "https://efectococuyo.com/la-humanidad/numeros-de-emergencia-de-bomberos-y-proteccion-civil/"
      },
      {
        "organization": "Cuerpo de Bomberos - Coro (estación central, capital de Falcón)",
        "category": "bomberos",
        "phones": [
          "0268-2539923",
          "0268-2514534",
          "0268-3409028"
        ],
        "verified": false,
        "notes": "VERIFICAR ANTES DE USAR. Números atribuidos a la estación central de Bomberos en Coro (código 0268), provenientes de un único directorio agregado; no se pudo confirmar de forma cruzada con fuente oficial. El directorio noticiahoy listó para 'Bomberos Falcón' los números 0269-2471164/2471165, que corresponden al área de Paraguaná (0269), no a Coro.",
        "source": "https://rescate.com/bomberos.html"
      },
      {
        "organization": "Bomberos Aeronáuticos de Coro (Aeropuerto José Leonardo Chirino)",
        "category": "bomberos",
        "phones": [
          "0268-2517156"
        ],
        "verified": false,
        "notes": "VERIFICAR. Fuente única (directorio agregado). Servicio de bomberos del aeropuerto de Coro.",
        "source": "https://rescate.com/bomberos.html"
      },
      {
        "organization": "Cruz Roja Venezolana - Seccional Falcón / Hospital Tipo II (Coro)",
        "category": "cruz_roja",
        "phones": [
          "0268-2523427"
        ],
        "verified": true,
        "notes": "Hospital Tipo II Cruz Roja Venezolana, Calle Buchivacoa entre Calle Federación y Colón, Centro Clínico Solidario, Coro. Número del directorio oficial de Cruz Roja Venezolana (+58 268-2523427).",
        "source": "https://cruzroja.ve/nuestra-presencia/"
      },
      {
        "organization": "Cruz Roja Venezolana - Ambulatorio Tipo III 'Enfermera Olga Molina' (Punto Fijo)",
        "category": "cruz_roja",
        "phones": [
          "0269-2459434"
        ],
        "verified": true,
        "notes": "Sector Nuevo Pueblo Sur, Calle España con Mariño, Punto Fijo. Número del directorio oficial Cruz Roja Venezolana (+58 269-2459434). Correo punto.fijo@cruzroja.ve.",
        "source": "https://cruzroja.ve/nuestra-presencia/"
      },
      {
        "organization": "Cruz Roja Venezolana - Ambulatorio Tipo I (La Vela de Coro)",
        "category": "cruz_roja",
        "phones": [
          "0412-7684792"
        ],
        "verified": true,
        "notes": "Esquina Calle Zamora con Calle Miranda, diagonal a la Plaza Bolívar de La Vela de Coro. Número celular del directorio oficial Cruz Roja Venezolana (+58 412-7684792). Correo la.vela@cruzroja.ve.",
        "source": "https://cruzroja.ve/nuestra-presencia/"
      },
      {
        "organization": "Red de Emergencia Falcón (Punto Fijo / Paraguaná)",
        "category": "rescate",
        "phones": [
          "0269-2478536"
        ],
        "verified": true,
        "notes": "Línea de Red de Emergencia regional. Confirmada por dos resultados de búsqueda independientes (Rescate Occidente y la ficha de Cruz Roja/CiudadGPS de Falcón).",
        "source": "https://rescateoccidente.org/directorio-de-emergencias/"
      },
      {
        "organization": "Ambulancias Punto Fijo",
        "category": "rescate",
        "phones": [
          "0269-2450921"
        ],
        "verified": false,
        "notes": "VERIFICAR. Servicio de ambulancias en Punto Fijo (Paraguaná), reportado por una sola fuente (directorio de Rescate Occidente vía resultado de búsqueda).",
        "source": "https://rescateoccidente.org/directorio-de-emergencias/"
      },
      {
        "organization": "Hospital Universitario Dr. Alfredo Van Grieken (Coro)",
        "category": "hospital",
        "phones": [
          "0268-2516433"
        ],
        "verified": true,
        "notes": "Principal hospital tipo IV de Falcón, capital Coro. Av. El Tenis con Av. Santa Rosa, sector Monte Verde. Emergencia 24h. Confirmado por dos fuentes (todosnegocios y near-place: +58 268-2516433). Nota: gelvez listó '0268-5216433', dígitos transpuestos del mismo número; el correcto es 0268-2516433.",
        "source": "https://ve.todosnegocios.com/hospital-universitario-dr-alfredo-van_3g-0268-2516433"
      },
      {
        "organization": "Hospital General Regional Dr. Rafael Calles Sierra (Punto Fijo)",
        "category": "hospital",
        "phones": [
          "0269-2456633"
        ],
        "verified": true,
        "notes": "Principal hospital de la península de Paraguaná. Av. Táchira con Av. Intercomunal, Punta Cardón, Carirubana, Punto Fijo. Emergencia 24h con ambulancias. Confirmado por dos fuentes (todosnegocios y near-place: +58 269-2456633). Variantes/anexos reportados: 0269-2454763 (fax), 0269-2456933.",
        "source": "https://ve.todosnegocios.com/hospital-dr-rafael-calles-sierra_10-0269-2456633"
      },
      {
        "organization": "Policía Nacional Bolivariana (PNB) - línea nacional + Falcón",
        "category": "policia",
        "phones": [
          "0800-7654622",
          "0269-2474165"
        ],
        "verified": false,
        "notes": "VERIFICAR. 0800-POLINAC = 0800-7654622 (línea nacional PNB) y 0269-2474165 (Falcón, área Paraguaná) provienen de un único directorio agregado, sin confirmación cruzada oficial. Para emergencias policiales inmediatas se recomienda el 911.",
        "source": "https://noticiahoy.es/numeros-de-emergencia-falcon---tenlos-a-mano.html"
      },
      {
        "organization": "Guardia Nacional Bolivariana (GNB) - línea nacional + Falcón",
        "category": "policia",
        "phones": [
          "0800-4827342",
          "0269-2471244"
        ],
        "verified": false,
        "notes": "VERIFICAR. 0800-GUARDIA = 0800-4827342 y 0269-2471244 (Falcón) provienen de un único directorio agregado, sin confirmación cruzada oficial.",
        "source": "https://noticiahoy.es/numeros-de-emergencia-falcon---tenlos-a-mano.html"
      }
    ]
  },
  {
    "state": "Lara",
    "areaCode": "0251",
    "contacts": [
      {
        "organization": "VEN911 - Sistema Integrado de Emergencias (codigo corto nacional / Movistar)",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Numero unico de emergencias. Confirmado por multiples fuentes independientes y aplicable en Lara. Movistar enruta al 911.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencias Digitel (codigo corto nacional)",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Codigo corto para usuarios Digitel. Confirmado por laverdaddemonagas y eldiario tras el sismo del 24/06/2026.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Emergencias Movilnet (codigo corto nacional)",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Codigo corto para usuarios Movilnet. Confirmado por laverdaddemonagas y eldiario. Nota: una fuente local de Barquisimeto lista *911 para Movilnet, por lo que conviene probar ambos.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Emergencias CANTV / SAE Lara (codigo corto nacional, lineas fijas)",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "171 atiende emergencias desde lineas fijas CANTV y corresponde al Servicio Autonomo de Emergencias Lara (SAE 171). Confirmado por laverdaddemonagas, eldiario y fuentes de Lara.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      },
      {
        "organization": "Servicio Autonomo de Emergencias Lara (SAE 171) - central operativa",
        "category": "hotline",
        "phones": [
          "171",
          "0251-2322729"
        ],
        "verified": false,
        "notes": "El 171 esta confirmado como codigo de emergencias; el numero directo 0251-2322729 proviene de un solo resultado de busqueda y no fue cross-verificado en fuente oficial (el portal sel171.gob.ve no respondio).",
        "source": "http://sel171.gob.ve/PAGINAS-QUIENES%20SOMOS/Quienes%20Somos-Organismos%20Adcritos.htm"
      },
      {
        "organization": "Proteccion Civil y Administracion de Desastres - Nacional",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Lineas nacionales gratuitas de Proteccion Civil activadas tras el sismo M7.5 del 24/06/2026. Confirmado por laverdaddemonagas y corroborado en busqueda.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil / Defensa Civil Lara (regional, Barquisimeto)",
        "category": "proteccion_civil",
        "phones": [
          "0251-2544889",
          "0251-2543965"
        ],
        "verified": true,
        "notes": "Numeros regionales de Proteccion Civil/Defensa Civil del estado Lara. Confirmado por barquisimeto.com y corroborado por busqueda referida a PCAD Lara (@pcadlara).",
        "source": "https://www.barquisimeto.com/servicios/telefonos-de-emergencia/"
      },
      {
        "organization": "Cuerpo de Bomberos de Iribarren (Barquisimeto)",
        "category": "bomberos",
        "phones": [
          "0251-2317475",
          "0251-2319131"
        ],
        "verified": true,
        "notes": "Sede en carrera 30 con Av. Carabobo. Cross-verificado por gelvez.com.ve y barquisimeto.com.",
        "source": "https://www.barquisimeto.com/servicios/telefonos-de-emergencia/"
      },
      {
        "organization": "Bomberos Aeronauticos (Aeropuerto Internacional Jacinto Lara)",
        "category": "bomberos",
        "phones": [
          "0251-4422990"
        ],
        "verified": false,
        "notes": "Una sola fuente. No cross-verificado.",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "Cruz Roja Venezolana - Seccional Lara (Barquisimeto)",
        "category": "cruz_roja",
        "phones": [
          "0414-5086512",
          "0424-5086512"
        ],
        "verified": true,
        "notes": "Numeros indicados como solo WhatsApp y mensajes en la pagina oficial. Sede en Urb. Patarata, Av. Andres Eloy Blanco, Ambulatorio Dr. Nelson Garcia Garcia. Horario 7am-5pm. Confirmado por la pagina oficial cruzrojalara.org.ve.",
        "source": "https://www.cruzrojalara.org.ve/contact/"
      },
      {
        "organization": "Cruz Roja Venezolana - Seccional Lara (lineas fijas)",
        "category": "cruz_roja",
        "phones": [
          "0251-2547021",
          "0251-2542277",
          "0251-2543354"
        ],
        "verified": false,
        "notes": "Lineas fijas reportadas por busqueda (0251-2547021 / 2542277) y por barquisimeto.com (0251-2543354). No coinciden entre si exactamente; la pagina oficial solo publica los WhatsApp 0414/0424-5086512. Verificar antes de difundir.",
        "source": "https://www.barquisimeto.com/servicios/telefonos-de-emergencia/"
      },
      {
        "organization": "Ambulancias San Juan (Barquisimeto)",
        "category": "rescate",
        "phones": [
          "0251-4467850",
          "0416-6521012",
          "0416-6522969"
        ],
        "verified": false,
        "notes": "Servicio privado de ambulancias 24 horas, Carrera 16 entre calles 37 y 38. Una sola fuente.",
        "source": "https://www.barquisimeto.com/servicios/telefonos-de-emergencia/"
      },
      {
        "organization": "Hospital Central Universitario Dr. Antonio Maria Pineda (Barquisimeto)",
        "category": "hospital",
        "phones": [
          "0251-2524845"
        ],
        "verified": false,
        "notes": "Principal hospital tipo IV de Lara. Una sola fuente; barquisimeto.com lista un numero generico de hospital distinto (0251-2523450). No cross-verificado.",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "Hospital Pediatrico Dr. Agustin Zubillaga (Barquisimeto)",
        "category": "hospital",
        "phones": [
          "0251-2526835"
        ],
        "verified": false,
        "notes": "Una sola fuente. No cross-verificado.",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "Hospital Dr. Luis Gomez Lopez (IVSS, Barquisimeto)",
        "category": "hospital",
        "phones": [
          "0251-2523862"
        ],
        "verified": false,
        "notes": "Una sola fuente. No cross-verificado.",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "Policia del Estado Lara (PoliLara) / Policia de Barquisimeto",
        "category": "policia",
        "phones": [
          "0251-2310111",
          "0251-2520367"
        ],
        "verified": true,
        "notes": "Numero principal 0251-2310111 confirmado por gelvez.com.ve y barquisimeto.com. El 0251-2520367 aparece en barquisimeto.com.",
        "source": "https://www.barquisimeto.com/servicios/telefonos-de-emergencia/"
      },
      {
        "organization": "Policia Municipal de Iribarren",
        "category": "policia",
        "phones": [
          "0251-2542888"
        ],
        "verified": false,
        "notes": "Una sola fuente. No cross-verificado.",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "CICPC Barquisimeto (Cuerpo de Investigaciones Cientificas, Penales y Criminalisticas)",
        "category": "policia",
        "phones": [
          "0251-2370511"
        ],
        "verified": true,
        "notes": "Confirmado por gelvez.com.ve y barquisimeto.com (listado como CICP 0251-237.0511).",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "CICPC San Juan (Barquisimeto)",
        "category": "policia",
        "phones": [
          "0251-4451745"
        ],
        "verified": false,
        "notes": "Una sola fuente. No cross-verificado.",
        "source": "https://gelvez.com.ve/barquisimeto/emergencias.html"
      },
      {
        "organization": "FUNVISIS - reporte de sismo sentido (linea 0800-TEMBLOR)",
        "category": "otro",
        "phones": [
          "0800-8362567"
        ],
        "verified": false,
        "notes": "0800-TEMBLOR = 0800-8362567, citado por una sola fuente (eldiario). FUNVISIS canaliza reportes de sismo sentido principalmente por formulario web (funvisis.gob.ve), no por telefono; el sitio oficial no respondio para verificar. Tratar como no confirmado.",
        "source": "https://eldiario.com/2026/06/24/recomendaciones-sismo/"
      }
    ]
  },
  {
    "state": "Trujillo",
    "areaCode": "0271",
    "contacts": [
      {
        "organization": "Linea Nacional de Emergencias (Movistar)",
        "category": "hotline",
        "phones": [
          "911"
        ],
        "verified": true,
        "notes": "Codigo corto nacional de emergencias. Confirmado como activo tras el sismo del 24-jun-2026. Algunas fuentes lo asocian a Movistar; otras lo describen como numero unico nacional. Funciona a nivel nacional incluido Trujillo.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Linea Nacional de Emergencias (Digitel)",
        "category": "hotline",
        "phones": [
          "112"
        ],
        "verified": true,
        "notes": "Codigo corto de emergencias para usuarios Digitel (gratuito). Confirmado en el listado de emergencias del sismo del 24-jun-2026.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Linea Nacional de Emergencias (Movilnet)",
        "category": "hotline",
        "phones": [
          "*1"
        ],
        "verified": true,
        "notes": "Codigo corto de emergencias para usuarios Movilnet (gratuito). Confirmado en el listado de emergencias del sismo del 24-jun-2026. Una fuente alterna lista *911 para Movilnet; cruce muestra ambiguedad en el mapeo operador-codigo, pero el codigo *1 esta confirmado.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Linea Nacional de Emergencias (CANTV / fijos)",
        "category": "hotline",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "Codigo corto de emergencias desde lineas fijas CANTV. Confirmado por dos fuentes. Tambien historicamente usado como numero de emergencias nacional.",
        "source": "https://venezuelatelefonos.com/emergencia.htm"
      },
      {
        "organization": "Proteccion Civil y Administracion de Desastres (Nacional)",
        "category": "proteccion_civil",
        "phones": [
          "0800-5588427",
          "0800-2668446",
          "0800-2624368"
        ],
        "verified": true,
        "notes": "Lineas gratuitas nacionales de Proteccion Civil Nacional. Confirmadas en el listado oficial de emergencias publicado tras el sismo del 24-jun-2026 y por busqueda cruzada. La linea 0800-5588427 (0800-558842) aparece tambien en directorio telefonico nacional.",
        "source": "https://laverdaddemonagas.com/2026/06/24/atencion-numeros-de-emergencia/"
      },
      {
        "organization": "Proteccion Civil Nacional (linea gratuita PCIVIL)",
        "category": "proteccion_civil",
        "phones": [
          "0800-7248451"
        ],
        "verified": true,
        "notes": "Linea gratuita nacional 0800-PCIVIL1 (0800-7248451) listada por Proteccion Civil. Verificada por dos fuentes (directorio Trujillo y cuenta oficial de Proteccion Civil Venezuela).",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Proteccion Civil y Administracion de Desastres - Direccion Estadal Trujillo",
        "category": "proteccion_civil",
        "phones": [
          "0272-6721030",
          "0272-6721018",
          "0271-2317111",
          "0800-8785455"
        ],
        "verified": true,
        "notes": "Direccion Estadal de Proteccion Civil de Trujillo. Sede en sector Mirabelido, eje vial Trujillo-Valera, Urb El Prado, municipio Pampanito. La linea 0800-8785455 (0800-TRUJILL) es la sala situacional / numero de atencion para reportar eventualidades. Numeros confirmados por directorio de Trujillo y busqueda de Proteccion Civil. Nota: la sede oficial pcivil.gob.ve/trujillo estaba inaccesible al momento de la consulta.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Comandancia General de Bomberos del Estado Trujillo",
        "category": "bomberos",
        "phones": [
          "0272-2364477"
        ],
        "verified": true,
        "notes": "Comandancia General de Bomberos del estado Trujillo. Confirmado por directorio de Trujillo y resultados de busqueda cruzada.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Cuerpo de Bomberos del Municipio Valera - Estacion Central",
        "category": "bomberos",
        "phones": [
          "0271-2316184",
          "0271-2311777"
        ],
        "verified": true,
        "notes": "Estacion central de Bomberos de Valera. El numero 0271-2316184 aparece en el directorio de Trujillo y 0271-231-17-77 en el directorio nacional rescate.com; ambos confirman la estacion central de Valera por dos fuentes independientes.",
        "source": "https://rescate.com/bomberos.html"
      },
      {
        "organization": "Cuerpo de Bomberos - Estacion Carache (Trujillo)",
        "category": "bomberos",
        "phones": [
          "0272-9991006"
        ],
        "verified": true,
        "notes": "Estacion de Bomberos de Carache, estado Trujillo. Confirmado por el directorio de emergencia de Trujillo y por busqueda.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Cuerpo de Bomberos - Estacion Sabana de Mendoza (Trujillo)",
        "category": "bomberos",
        "phones": [
          "0271-6694536"
        ],
        "verified": true,
        "notes": "Estacion de Bomberos de Sabana de Mendoza, estado Trujillo. Confirmado por el directorio de emergencia de Trujillo y por busqueda.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Cuerpo de Bomberos - Estacion Peaje San Antonio (Trujillo)",
        "category": "bomberos",
        "phones": [
          "0272-5116689"
        ],
        "verified": false,
        "notes": "Estacion de Bomberos del Peaje San Antonio. Aparece en una sola fuente (directorio de emergencia de Trujillo); no se hallo segunda confirmacion independiente.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Cuerpo de Bomberos - Bomberos Forestales (Trujillo)",
        "category": "bomberos",
        "phones": [
          "0272-4146203"
        ],
        "verified": false,
        "notes": "Brigada de Bomberos Forestales del estado Trujillo. Aparece en una sola fuente (directorio de emergencia de Trujillo); sin segunda confirmacion independiente.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Cruz Roja Venezolana - Seccional Trujillo (Ambulatorio Urbano Tipo I Dr. Rafael A. Navas B.)",
        "category": "cruz_roja",
        "phones": [
          "+584164721852"
        ],
        "verified": true,
        "notes": "Sede de la Cruz Roja Venezolana en Trujillo. Direccion: Avenida Cuatricentenario, Sector los Lavaderos, frente al Country Club, Edificio Cruz Roja, C.P. 1201. Correo: trujillo@cruzroja.ve. Numero confirmado en el sitio web oficial de la Cruz Roja Venezolana.",
        "source": "https://cruzroja.ve/nuestra-presencia/"
      },
      {
        "organization": "Ambulancias Trujillo",
        "category": "medico",
        "phones": [
          "0271-2378692"
        ],
        "verified": false,
        "notes": "Servicio de ambulancias en Trujillo. Una sola fuente (directorio de emergencia de Trujillo); sin segunda confirmacion.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Ambulancias San Rafael (Trujillo)",
        "category": "medico",
        "phones": [
          "0271-2327171"
        ],
        "verified": false,
        "notes": "Servicio de ambulancias en Trujillo. Una sola fuente (directorio de emergencia de Trujillo); sin segunda confirmacion.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Ambulancias del Sur (Trujillo)",
        "category": "medico",
        "phones": [
          "0271-2310333"
        ],
        "verified": false,
        "notes": "Servicio de ambulancias en Trujillo. Una sola fuente (directorio de emergencia de Trujillo); sin segunda confirmacion.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Hospital Universitario Dr. Pedro Emilio Carrillo (Valera)",
        "category": "hospital",
        "phones": [
          "0271-2310533"
        ],
        "verified": true,
        "notes": "Principal hospital de Valera, estado Trujillo (HUPEC), emergencias 24/7. Direccion: Avenida 13 con calle 6 / Calle Hospital Central, Valera. Numero 0271-231-0533 confirmado por busqueda especifica con codigo de area correcto de Valera (0271). Nota: el directorio noticiahoy.es listaba un numero distinto (0272-236-63-33) con codigo de area de la ciudad de Trujillo; existe discrepancia entre fuentes en el codigo de area, se prioriza el numero de Valera (0271).",
        "source": "https://infoguia.com/is.asp?emp=hospital-dr-pedro-emilio-carrillo-valera&clte=99624238&ciud=398"
      },
      {
        "organization": "Hospital Dr. Jose Gregorio Hernandez (Trujillo)",
        "category": "hospital",
        "phones": [
          "0271-2366422"
        ],
        "verified": false,
        "notes": "Hospital en el estado Trujillo. Aparece en una sola fuente (directorio de emergencia de Trujillo); sin segunda confirmacion independiente.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Hospital Dr. Juan Motezuma Ginnari (Trujillo)",
        "category": "hospital",
        "phones": [
          "0271-2350911"
        ],
        "verified": false,
        "notes": "Hospital en el estado Trujillo. Aparece en una sola fuente (directorio de emergencia de Trujillo); sin segunda confirmacion independiente.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      },
      {
        "organization": "Policia Nacional Bolivariana / Policia (Trujillo)",
        "category": "policia",
        "phones": [
          "171"
        ],
        "verified": true,
        "notes": "El directorio de emergencia de Trujillo indica el 171 como linea de la Policia Nacional Bolivariana. No se obtuvo un numero directo verificado de PoliTrujillo o del Centro de Coordinacion Policial Estadal Trujillo (con sede en Valera) en fuentes consultadas; usar codigos cortos nacionales (911/112/*1/171) para contacto policial.",
        "source": "https://www.noticiahoy.es/telefonos-de-emergencia-en-trujillo-guardalos-en-tu-movil.html"
      }
    ]
  }
];
