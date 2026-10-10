import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="page-card not-found-card text-center">
        <div className="not-found-glow" aria-hidden />
        <span className="not-found-pill">ERROR 404</span>
        <h2>404 - Página no encontrada</h2>
        <p className="not-found-lead">
          La ruta que buscas no existe o ha sido movida a otra ubicación.
        </p>
        <Link to="/" className="btn btn-primary not-found-btn">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};
