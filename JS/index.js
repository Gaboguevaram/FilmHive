
/* SEGUNDO EFECTO DOM */

//Agrandado de peliculas

document.addEventListener("DOMContentLoaded", agrandadoPeliculas) 

function agrandadoPeliculas () {
    //Seleccionamos todas las figuras con imágenes
    let figuras = document.querySelectorAll("main figure");

    figuras.forEach(function(figura){
        let imagen = figura.querySelector("img"); //Obtenemos la imagen dentro de cada figure
        
        // Evento cuando el ratón entra (efecto zoom)
        figura.addEventListener("mouseover", function(){
        //    imagen.style.zIndex="100px";
            imagen.style.transform = "scale(1.2)"; // Aumentar tamaño
            imagen.style.transition = "transform 0.3s ease-in-out"; // Animación suave
        });

        //Evento cuando el ratón sale (vuelve al tamaño original)
        figura.addEventListener("mouseout", function(){
            imagen.style.transform = "scale(1)"; // Regresa a su tamaño
        });

    });
    
};

