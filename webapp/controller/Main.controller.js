sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,JSONModel, Fragment, Filter, FilterOperator) => {
    "use strict";

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

        onValueHelpItemPress: function (oEvent) {
            var oData = oEvent.getSource().getBindingContext("oMainModel").getObject();
            this.setCargaValuesToInput(oData);
            this.onValueHelpCancel();
        },

        setCargaValuesToInput: function (oData) {
            this.byId("idCargaInput").setValue(oData.UploadUuid);
            this.byId("fechaCargaInput").setValue(oData.LocalCreatedAt.split("T")[0].split("-").reverse().join("-"));
            this.byId("usuarioSelect").setValue(oData.LocalCreatedBy);
            this.byId("estadoSelect").setValue(oData.Status);
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

            var aFilters = [];
            if (sSearchValue) {
                aFilters.push(new Filter("UploadUuid", FilterOperator.EQ, sSearchValue));
            }
            if (sDateValue) {
                let nDateValue = new Date(sDateValue);
                nDateValue.setDate(nDateValue.getDate() + 1);
                aFilters.push(new Filter({filters: [
                    new Filter("LocalCreatedAt", FilterOperator.GE, sDateValue.toISOString()),
                    new Filter("LocalCreatedAt", FilterOperator.LT, nDateValue.toISOString())
                ], and: true}));
            }
            if (sUserValue) {
                aFilters.push(new Filter("LocalCreatedBy", FilterOperator.EQ, sUserValue));
            }
            if (sStateValue && sStateValue !== "Todos") {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStateValue));
            }

            oTable.getBinding("items").filter(aFilters);
        },

        onLimpiar: function () {
            var oTable = this.byId("idCargaTable");
            oTable.getBinding("items").filter([]);
            this.byId("idCargaSearchField").setValue("");
            this.byId("fechaCargaField").setDateValue(null);
            this.byId("usuarioSelectField").setValue("");
            this.byId("estadoSelectField").setSelectedKey("Todos");
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
                //TODO message error popup
                console.error("Error al leer producto", oError);
            }
        }
    });
});