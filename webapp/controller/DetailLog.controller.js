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

    return Controller.extend("cl.copec.zui5sdapplogmig.controller.DetailLog", {
        onInit() {
          this.getOwnerComponent().getRouter().getRoute("RouteDetailLog").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: async function (oEvent) {
            // usar sId aquí
            var sId = oEvent.getParameter("arguments").idcarga;
            const oMainModel = this.getOwnerComponent().getModel("oMainModel");
            try {

                const aFilters = [
                    new Filter("IdCarga", FilterOperator.EQ, sId)                 
                ];

                const aSorters = [
                    new Sorter("LocalCreatedAt", true) // true = descendente
                ];
                

                const oListBinding = oMainModel.bindList("/DataLog", null, aSorters, aFilters);

                const aContexts = await oListBinding.requestContexts();

                const aData = aContexts.map(oContext => oContext.getObject());
                
                const oDataModel = new JSONModel(aData);

                this.getView().setModel(new JSONModel({ IdCarga: sId }), "oDetailLogIDCarga");
                this.getView().setModel(oDataModel, "oDetailLogData");

            } catch (oError) {
                // this.onMessageDialogPress("Error al leer producto: " + oError.message);
            }
        },

        onBuscarDetailFiltro: function (oEvent) {

            //get values
            var oTable = this.getView().byId("recordsLogTable");
            var sLog = this.getView().byId("idLog").getValue();
            var sFactura = this.getView().byId("idFact").getValue();
            
            //filtros
            var aFilters = [];

            var idCarga = this.getView().getModel("oDetailLogIDCarga").getProperty("/IdCarga");
            // aFilters.push(new Filter("IdCarga", FilterOperator.EQ, idCarga));

            if (sLog) {
                aFilters.push(new Filter("IdLog", FilterOperator.Contains, sLog));
            }
            if (sFactura) {
                aFilters.push(new Filter("IdFact", FilterOperator.Contains, sFactura));
            }

            //table
            try {
                var oBinding = oTable.getBinding("items");

                if (oBinding) {
                    oBinding.filter(aFilters);
                }
            } catch (error) {
                this.onMessageDialogPress("Error al aplicar filtros: " + error.message);
            }
        },
        onLimpiarDetailFiltro: function (oEvent) {
            var oTable = this.getView().byId("recordsLogTable");
            oTable.getBinding("items").filter([]);
            this.getView().byId("idLog").setValue("");
            this.getView().byId("idFact").setValue("");
        }
    });
});