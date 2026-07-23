/* Efecto XML: Carga de foros */

document.addEventListener("DOMContentLoaded",()=>{
    buscar("","");

    document.querySelector(".barraBuscar").addEventListener("keypress",(event)=>{
        if (event.key =="Enter"){
            let nombre = document.querySelector(".barraBuscar").value;
            let tematica = document.querySelector("#selectorTematica").value;
            if(tematica == "Todo" || tematica == "TEMÁTICA"){
                buscar(nombre,"");
            }else{
                buscar(nombre,tematica);
            }
        }
    });

    document.querySelector("#selectorTematica").addEventListener("change",(event)=>{
        let nombre = document.querySelector(".barraBuscar").value;
        let tematica = document.querySelector("#selectorTematica").value;
        if(tematica == "Todo" || tematica == "TEMÁTICA"){
            buscar(nombre,"");
        }else{
            buscar(nombre,tematica);
        }
    });

    function buscar(nombre,tematica){
        fetch("../ARCHIVOS/foros.xml")
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            let foros = data.getElementsByTagName("foro");
            let tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; // Limpia la tabla antes de agregar datos

            for (let i = 0; i < foros.length; i++) {

                let nombreForo = foros[i].getElementsByTagName("nombre")[0].textContent;
                let tematicaForo = foros[i].getElementsByTagName("tematica")[0].textContent;

                let coincideNombre =  true;
                let coincideTematica =  true;

                if(nombre.trim()!=""){
                    let regex1 = new RegExp(nombre,"i");
                    coincideNombre = regex1.test(nombreForo);
                }

                if(tematica.trim()!=""){
                    let regex2 = new RegExp(tematica,"i");
                    coincideTematica = regex2.test(tematicaForo);
                }

                console.log("nombre: " + coincideNombre);

                console.log("tematica: " + coincideTematica);

                if(coincideNombre && coincideTematica){
                    let row = document.createElement("tr");
                    row.innerHTML = "<td>"+nombreForo+"</td>"+
                    "<td>"+tematicaForo+"</td>"+
                    "<td>"+foros[i].getElementsByTagName("posts")[0].textContent+"</td>"+
                    "<td>"+foros[i].getElementsByTagName("miembros")[0].textContent+"</td>";
                    tbody.appendChild(row);
                } 
            }
        })
        .catch(error => console.error("Error al cargar el XML:", error));
    }

});