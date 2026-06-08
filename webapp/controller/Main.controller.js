sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/Dialog",
    "sap/ui/core/IconPool",
    "sap/ui/model/Sorter"
], (Controller, JSONModel, Fragment, Filter, FilterOperator, Button, mobileLibrary, Dialog, IconPool, Sorter) => {
    "use strict";

    // shortcut for sap.m.ButtonType
    var ButtonType = mobileLibrary.ButtonType;

    // shortcut for sap.m.DialogType
    var DialogType = mobileLibrary.DialogType;

    return Controller.extend("cl.copec.migrationapp.migrationapp.controller.Main", {
        onInit() {
            this.onReadParams();
        },

        onIdCargaValueHelp: function () {
            if (!this._oIdCargaDialog) {
                this._oIdCargaDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "cl.copec.migrationapp.migrationapp.view.fragments.IdCargaValueHelp",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            this._oIdCargaDialog.then(function (oDialog) {

                var oTable = this.byId("idCargaTable");
                if (oTable) {
                    oTable.getBinding("items").filter([]);
                }
                var oSearchField = this.byId("idCargaSearchField");
                if (oSearchField) {
                    oSearchField.setValue("");
                }
                oDialog.open();
            }.bind(this));
        },

        onValueHelpItemPress: async function (oEvent) {
            var oData = oEvent.getSource().getBindingContext("oMainModel").getObject();
            // await this.onSearchCarga(oData.UploadUuid);
            this.setCargaValuesToInput(oData);
            this.onValueHelpCancel();
        },

        setCargaValuesToInput: function (oData) {
            //Datos Generales
            this.byId("idCargaInput").setValue(oData.UploadUuid);
            this.byId("fileNameInput").setValue(oData.Filename);
            this.byId("fechaCargaInput").setValue(oData.LocalCreatedAt.split("T")[0].split("-").reverse().join("-"));
            this.byId("usuarioSelect").setValue(oData.LocalCreatedBy);
            this.byId("estadoSelect").setValue(oData.Status);
            
            //Totales
            this.byId("txtTotalRegistros").setText(oData.TotalRows);
            this.byId("txtRegistrosProcesados").setText(oData.RowsSuccess);
            this.byId("txtRegistrosConError").setText(oData.RowsError);
            this.byId("txtRegistrosPendientes").setText(oData.RowsPend);
            this.onGetLogValues(oData);
            

        },

        onGetLogValues: async function (oData) {
            var sIdCarga, sLocalCreatedAt, sUsuarioSelected, sEstadoSelect, nDateValue;
            var that = this;
            if (oData.UploadUuid) {
                sIdCarga = oData.UploadUuid;
            } else {
                return;
            }

            if (oData.LocalCreatedAt) {
                sLocalCreatedAt = new Date(oData.LocalCreatedAt);
                nDateValue = new Date(sLocalCreatedAt);
                nDateValue.setDate(nDateValue.getDate() + 1);
            }

            if (oData.LocalCreatedBy) {
                sUsuarioSelected = oData.LocalCreatedBy;
            }

            if (oData.Status) {
                sEstadoSelect = oData.Status;
            }

            const oMainModel = this.getOwnerComponent().getModel("oMainModel");

            try {

                const aFilters = [
                    new Filter("IdCarga", FilterOperator.EQ, sIdCarga),
                    new Filter("HasDraftEntity", FilterOperator.EQ, false)
                    // new Filter({filters: [
                    //     new Filter("LocalCreatedAt", FilterOperator.GE, sLocalCreatedAt.toISOString()),
                    //     new Filter("LocalCreatedAt", FilterOperator.LT, nDateValue.toISOString())
                    // ], and: true}),
                    // new Filter("LocalCreatedBy", FilterOperator.EQ, sUsuarioSelected),                    
                    // new Filter("MStatus", FilterOperator.EQ, sEstadoSelect),
                ];

                const aSorters = [
                    new Sorter("LocalCreatedAt", true) // true = descendente
                ];

                const oListBinding = oMainModel.bindList("/DataExcel", null, aSorters, aFilters);

                const aContexts = await oListBinding.requestContexts();

                const aData = aContexts.map(oContext => oContext.getObject());

                const oDataModel = new JSONModel(aData);
                this.getView().setModel(oDataModel, "oFilteredData");

            } catch (oError) {
                that.onMessageDialogPress("Error al leer producto: " + oError.message);
            }

        },

        onValueHelpCancel: function () {
            this.byId("idCargaValueHelpDialog").close();
        },

        onBuscar: function () {
            var oTable = this.byId("idCargaTable");
            var sSearchValue = this.byId("idCargaSearchField").getValue();
            var sDateValue = this.byId("fechaCargaField").getDateValue();
            var sUserValue = this.byId("usuarioSelectField").getValue();
            var sStateValue = this.byId("estadoSelectField").getSelectedKey();
            var that = this;
            var aFilters = [];
            if (sSearchValue) {
                aFilters.push(new Filter("UploadUuid", FilterOperator.EQ, sSearchValue));
            }
            if (sDateValue) {
                let nDateValue = new Date(sDateValue);
                nDateValue.setDate(nDateValue.getDate() + 1);
                aFilters.push(new Filter({
                    filters: [
                        new Filter("LocalCreatedAt", FilterOperator.GE, sDateValue.toISOString()),
                        new Filter("LocalCreatedAt", FilterOperator.LT, nDateValue.toISOString())
                    ], and: true
                }));
            }
            if (sUserValue) {
                aFilters.push(new Filter("LocalCreatedBy", FilterOperator.EQ, sUserValue));
            }
            if (sStateValue && sStateValue !== "Todos") {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStateValue));
            }

            try {
                oTable.getBinding("items").filter(aFilters);
            } catch (error) {
                that.onMessageDialogPress("Error al aplicar filtros: " + error.message);
            }
        },

        onBuscarFiltro: function () {
            var oTable = this.byId("recordsTable");
            var sFolio = this.byId("idFolioInput").getValue();
            var sPedido = this.byId("idPedidoInput").getValue();
            var sEntrega = this.byId("entregaInput").getValue();
            
            var sEstado = this.byId("estadoSelect2").getValue();

            var aFilters = [];

            if (sFolio) {
                aFilters.push(new Filter("Id", FilterOperator.Contains, sFolio));
            }
            if (sPedido) {
                aFilters.push(new Filter("MVbelnPed", FilterOperator.Contains, sPedido));
            }

            if (sEntrega) {
                aFilters.push(new Filter("MVbelnEnt", FilterOperator.Contains, sEntrega));
            }

            if (sEstado && sEstado !== "Todos") {
                aFilters.push(new Filter("MStatus", FilterOperator.EQ, sEstado));
            }

            try {
                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    oBinding.filter(aFilters);
                }
            } catch (error) {
                this.onMessageDialogPress("Error al aplicar filtros: " + error.message);
            }
        },
        onLimpiar2: function () {
            var oTable = this.byId("recordsTable");
            oTable.getBinding("items").filter([]);
            this.byId("idFolioInput").setValue("");
            this.byId("idPedidoInput").setValue("");
            this.byId("entregaInput").setValue("");
            this.byId("estadoSelect2").setSelectedKey("Todos");
        },
        onLimpiar: function () {
            var oTable = this.byId("idCargaTable");
            oTable.getBinding("items").filter([]);
            this.byId("idCargaSearchField").setValue("");
            this.byId("fechaCargaField").setDateValue(null);
            this.byId("usuarioSelectField").setValue("");
            this.byId("estadoSelectField").setSelectedKey("Todos");
        },
        onDownloadLog: async function () {
            
            if (!window.XLSX) {
                await new Promise(function (resolve, reject) {
                    var oScript = document.createElement("script");
                    oScript.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
                    oScript.onload = resolve;
                    oScript.onerror = reject;
                    document.head.appendChild(oScript);
                });
            }

            var XLSX = window.XLSX;
            var aData = this.getView().getModel("oFilteredData").getData();

            var aHeaders = [ "Pedido", "Entrega (Folio)", "SM", "Transporte", "Estado", "Mensaje de Log"];
            var aRows = aData.map(function (oItem) {
                return [                    
                    oItem.MVbelnPed || "",
                    oItem.MVbelnEnt || "",
                    oItem.MMblnr || "",
                    "",
                    oItem.MStatus || "",
                    oItem.MMsgtext || ""
                ];
            });

            var aSheetData = [aHeaders].concat(aRows);
            var oSheet = XLSX.utils.aoa_to_sheet(aSheetData);
            var oWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(oWorkbook, oSheet, "Log");

            XLSX.writeFile(oWorkbook, "Log_Carga_Masiva.xlsx");
        },
        onReadParams: async function () {
            let oComponentData = this.getOwnerComponent().getComponentData();
            if (oComponentData && oComponentData.startupParameters) {
                let sIdCarga = oComponentData.startupParameters.IdCarga && oComponentData.startupParameters.IdCarga[0];
                if (sIdCarga) {
                    this.byId("idCargaInput").setValue(sIdCarga);
                    await this.onSearchCarga(sIdCarga);
                }
            }
        },

        onSearchCarga: async function (sIdCarga) {
            const oModel = this.getOwnerComponent().getModel("oMainModel");
            const sPath = "/CargaMasiva('" + sIdCarga + "')";
            var that = this;
            try {
                const oContextBinding = oModel.bindContext(sPath);
                const oData = await oContextBinding.requestObject();
                that.setCargaValuesToInput(oData);
            } catch (oError) {
                // console.error("Error al leer producto", oError);
                that.onMessageDialogPress("No se encontró la carga con Id: " + sIdCarga);
            }
        },

        onMessageDialogPress: function (sMessage) {
            if (!this.oEscapePreventDialog) {
                this.oEscapePreventDialog = new Dialog({
                    title: "Aviso",
                    content: new Text({ text: sMessage }).addStyleClass("sapUiSmallMargin"),
                    buttons: [
                        new Button({
                            type: ButtonType.Emphasized,
                            text: "Cerrar",
                            press: function () {
                                this.oEscapePreventDialog.close();
                            }.bind(this)
                        })
                    ]
                });
            }

            this.oEscapePreventDialog.open();
        },

        //nav a app standard, con validación de intent

        _isIntentSupported: function (sIntent) {
            return new Promise(function (resolve, reject) {
                try {
                    var oCAN = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation");
                    if (!oCAN) {
                        return resolve(false);
                    }

                    // isIntentSupported accepts an array of intent strings
                    // older implementations use jQuery.Deferred (.done/.fail)
                    var aIntents = [sIntent];
                    var oResult = oCAN.isIntentSupported(aIntents);

                    if (oResult && oResult.done) {
                        oResult.done(function (oRes) {
                            // response shape may be {"#Semantic-action": {supported: true}} or without '#'
                            var bSupported = false;
                            if (oRes[sIntent] && oRes[sIntent].supported) {
                                bSupported = true;
                            } else if (oRes[sIntent.replace(/^#/, "")] && oRes[sIntent.replace(/^#/, "")].supported) {
                                bSupported = true;
                            } else {
                                // try finding any supported key
                                Object.keys(oRes).forEach(function (k) {
                                    if (oRes[k] && oRes[k].supported) {
                                        bSupported = true;
                                    }
                                });
                            }
                            resolve(bSupported);
                        }).fail(function () {
                            resolve(false);
                        });
                    } else if (oResult && typeof oResult.then === "function") {
                        oResult.then(function (oRes) {
                            var bSupported = false;
                            if (oRes[sIntent] && oRes[sIntent].supported) {
                                bSupported = true;
                            } else if (oRes[sIntent.replace(/^#/, "")] && oRes[sIntent.replace(/^#/, "")].supported) {
                                bSupported = true;
                            } else {
                                Object.keys(oRes).forEach(function (k) {
                                    if (oRes[k] && oRes[k].supported) {
                                        bSupported = true;
                                    }
                                });
                            }
                            resolve(bSupported);
                        }).catch(function () {
                            resolve(false);
                        });
                    } else {
                        // unknown return type
                        resolve(false);
                    }
                } catch (e) {
                    resolve(false);
                }
            });
        },

        onNavToSalesOrder: async function () {
            var sSalesOrder = "5000000123"; // tu parámetro
            var sIntent = "#SalesOrder-displayFactSheet";
            
            var bSupported = await this._isIntentSupported(sIntent);
            if (!bSupported) {
                // intentar sin '#'
                bSupported = await this._isIntentSupported(sIntent.replace(/^#/, ""));
            }

            if (bSupported) {
                var oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation");
                if (oCrossAppNav) {
                    oCrossAppNav.toExternal({
                        target: {
                            semanticObject: "SalesOrder",
                            action: "displayFactSheet"
                        },
                        params: {
                            SalesOrder: sSalesOrder
                        }
                    });
                    return;
                }
            }

            sap.m.MessageToast.show("Destino no disponible en el catálogo FLP o servicio no accesible.");
        }
    });
});