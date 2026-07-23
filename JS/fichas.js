/* PRIMER EFECTO DOM: Abrir y cerrar el trailer de la pelicula */

document.getElementById("botonAbrirTrailer").addEventListener("click",abrirTrailer)

function abrirTrailer(){
    
    var h1 = document.getElementsByTagName("h1")[0];
    
    var contenedor =  document.getElementById("contenedorTrailer");
    
   // console.log(iframe);
    contenedor.style.display="block";
    contenedor.style.transition = "opacity 0.5s ease-in-out, transform 0.5s ease-in-out";

    var etiquetaExistente = document.getElementById("tituloTrailer");

    if (!etiquetaExistente) { //Comprobación de si la etiqueta ya existe o no
        var etiqueta = document.createElement("p");
        etiqueta.id = "tituloTrailer"; // Le damos un ID para futuras comprobaciones
        etiqueta.style.textAlign="center";
        var texto = document.createTextNode(h1.textContent +" Trailer");
        etiqueta.appendChild(texto);
        contenedor.appendChild(etiqueta);
    }else{ //Si existe solo le cambiamos el nombre
        etiquetaExistente.textContent = h1.textContent +" Trailer";
    }
    setTimeout(function(){
        contenedor.style.transform = "translateX(-50%) scale(1)";
        contenedor.style.opacity="1";
    },10)
}

document.querySelector("button").addEventListener("click",cerrarTrailer)

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") { 
        cerrarTrailer();
    }
});

function cerrarTrailer(){
    var contenedor = document.getElementById("contenedorTrailer");
    contenedor.style.transform = "translateX(-50%) scale(0.1)";
    contenedor.style.opacity="0";
    setTimeout(function(){
        contenedor.style.display="none";
    },800)
}

/*--------------------------*/

/* SEGUNDO EFECTO JE6/JQUERY: Valorar una película/serie */

$(document).ready(()=>{

    let selected = false;

    let estrellas = $(document).find(".estrellas-valoracion");

    let contenedor = $(document).find("#valorar");


    /* Efecto JSON: Obtención nota película */ 
    
     var xhttp = new XMLHttpRequest();
     xhttp.open("GET", "../ARCHIVOS/notas.json", true);
     xhttp.send();
     
     xhttp.onreadystatechange = function(){
         if (this.readyState == 4 && this.status == 200) { //Si se recibe la respuesta correctamente
            let nombreObra = $(document).find("h1")[0].innerText; //Se obtiene el nombre de la pelicula
            let puntuacion = 0;
            let contador = 0;
            const array = JSON.parse(this.responseText); //Se parsea el contenido
             for (let x in array.valoraciones){
                if(array.valoraciones[x].nombre == nombreObra){ //Se comprueba el nombre de la pelicula
                    contador++;
                    puntuacion+=array.valoraciones[x].valoracion;
                }
             }
             if(contador > 0){
                puntuacion = Math.round(puntuacion/contador);

                let estrellas_nota = $(document).find(".estrellas-nota");
                // Colorear las estrellas hasta la puntuación indicada
                for (let i = 0; i < puntuacion; i++) {
                    $(estrellas_nota[i]).css("color", "black");
                }

                for (let i = puntuacion; i < estrellas_nota.length; i++) {
                    $(estrellas_nota[i]).css("color", "grey");
                }
                console.log("Notas procesada con éxito: " + puntuacion);
             }           
         }else if(this.readyState == 4 && this.status != 200){
              // En caso de error
             console.error("Notas procesada con éxito", this.status, this.statusText);

         }
     };
    

    estrellas.on("click",(event)=>{ //Si se hace click en una estrella
        selected = true;
        let afectadas = $(event.currentTarget).prevAll().addBack();
        afectadas.css("color", "#f5b211"); // Colorea la actual y las anteriores de naranja
        afectadas.each((_,estrella)=>{
            if($(estrella).hasClass("fa-star-half-alt")){ //Las rellena al comppleto
                $(estrella).removeClass("fa-star-half-alt").addClass("fa-star");
            }
        });
        let siguientes =  $(event.currentTarget).nextAll() //Las siguientes las pone grises.
        siguientes.each((_,estrella)=>{
            if(!$(estrella).hasClass("boton")){
                $(estrella).css("color", "grey"); // Evita colorear el boton de desvalorar
            }
            if($(estrella).hasClass("fa-star-half-alt")){ //Las rellena
                console.log($(estrella));
                $(estrella).removeClass("fa-star-half-alt");
                $(estrella).addClass("fa-star");
            }
        });
    });

    estrellas.on("mouseover",(event)=>{ //Si se pasa el ratón por encima
        if (!selected){ //Si no se ha votado
            let afectadas = $(event.currentTarget).prevAll().addBack();
            afectadas.css("color", "#f5b211").each((_,estrella)=>{ // Colorea la actual y las anteriores de naranja
                if($(estrella).hasClass("fa-star-half-alt")){ //Las rellena
                    $(estrella).removeClass("fa-star-half-alt");
                    $(estrella).addClass("fa-star");
                }
            });
        }
    });

    estrellas.on("mouseout",(event)=>{ //Si se quita el ratón de las estrellas
        if (!selected){ //Si no se ha votado
            let afectadas = $(event.currentTarget).prevAll().addBack() //Restaura las estrellas al estado original
            afectadas.css("color", "grey").each((_,estrella)=>{ 
                if($(estrella).hasClass("fa-star-half-alt")){
                    $(estrella).removeClass("fa-star-half-alt");
                    $(estrella).addClass("fa-star");
                }
            });
        }   
    });

    estrellas.on("dblclick",(event)=>{ //Si se hace doble click la estrella se rellena a medias si estaba completa
        let seleccionada = $(event.currentTarget);
        if(seleccionada.hasClass("fa-star")){
            seleccionada.removeClass("fa-star");
            seleccionada.addClass("fa-star-half-alt");
        }       
    });


    contenedor.on("mouseover",()=>{ //Se añade el boton para quitar la valoración hecha
        let btn = $(document).find("#botonDesvalorar");
        if(selected){  
            if($("#botonDesvalorar").length === 0){ //Comprueba que no exista
                contenedor.append("<p id=botonDesvalorar>✖</p>");
                btn = $(document).find("#botonDesvalorar");
                btn.addClass("boton");
                btn.css("display","inline");
                btn.css("background","none");
                btn.css("border","none");
            }
            btn.show();
            btn.on("click",()=>{
                selected = false;
                btn.hide();
            });
        }
    });

    

});