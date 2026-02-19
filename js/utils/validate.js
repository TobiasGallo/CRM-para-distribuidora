/* ========================================
   VALIDACIONES VISUALES INLINE
   Muestra errores debajo de cada campo
   ======================================== */

const Validate = {
  /**
   * Validar un formulario completo con reglas personalizadas
   * @param {HTMLFormElement} form - El formulario a validar
   * @param {Object} rules - Reglas por nombre de campo
   * @returns {boolean} - true si es válido
   *
   * Ejemplo de rules:
   * {
   *   nombre_establecimiento: { required: true, minLength: 2, label: 'Nombre' },
   *   email: { type: 'email', label: 'Email' },
   *   telefono: { type: 'phone', label: 'Teléfono' },
   *   precio_base: { required: true, type: 'number', min: 0, label: 'Precio' },
   * }
   */
  form(form, rules) {
    // Limpiar errores previos
    this.clearErrors(form);

    let isValid = true;
    let firstError = null;

    for (const [fieldName, rule] of Object.entries(rules)) {
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (!input) continue;

      const value = input.value?.trim() || '';
      const error = this._validateField(value, rule, input);

      if (error) {
        this._showError(input, error);
        isValid = false;
        if (!firstError) firstError = input;
      } else {
        this._showSuccess(input);
      }
    }

    // Focus en el primer campo con error
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  },

  /**
   * Validar un campo individual
   */
  _validateField(value, rule, input) {
    const label = rule.label || input.name;

    // Required
    if (rule.required && !value) {
      return `${label} es obligatorio`;
    }

    // Si está vacío y no es required, saltar validaciones
    if (!value) return null;

    // MinLength
    if (rule.minLength && value.length < rule.minLength) {
      return `${label} debe tener al menos ${rule.minLength} caracteres`;
    }

    // MaxLength
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${label} no puede tener más de ${rule.maxLength} caracteres`;
    }

    // Type: email
    if (rule.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `Ingresá un email válido`;
      }
    }

    // Type: phone
    if (rule.type === 'phone') {
      const cleaned = value.replace(/[\s\-().+]/g, '');
      if (cleaned.length < 8 || !/^\d+$/.test(cleaned)) {
        return `Ingresá un teléfono válido`;
      }
    }

    // Type: number
    if (rule.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return `${label} debe ser un número válido`;
      }
      if (rule.min !== undefined && num < rule.min) {
        return `${label} debe ser mayor o igual a ${rule.min}`;
      }
      if (rule.max !== undefined && num > rule.max) {
        return `${label} debe ser menor o igual a ${rule.max}`;
      }
    }

    // Type: url
    if (rule.type === 'url') {
      try {
        new URL(value);
      } catch {
        return `Ingresá una URL válida (https://...)`;
      }
    }

    // Custom validator
    if (rule.custom && typeof rule.custom === 'function') {
      const customError = rule.custom(value, input);
      if (customError) return customError;
    }

    return null;
  },

  /**
   * Mostrar error debajo del campo
   */
  _showError(input, message) {
    input.classList.add('form-input-error');
    input.classList.remove('form-input-valid');

    // Crear mensaje de error
    const errorEl = document.createElement('span');
    errorEl.className = 'form-error-msg';
    errorEl.textContent = message;

    // Insertar después del input (o después del form-group si existe)
    const parent = input.closest('.form-group') || input.parentElement;
    // Evitar duplicados
    const existing = parent.querySelector('.form-error-msg');
    if (existing) existing.remove();
    parent.appendChild(errorEl);
  },

  /**
   * Mostrar campo válido
   */
  _showSuccess(input) {
    input.classList.add('form-input-valid');
    input.classList.remove('form-input-error');
  },

  /**
   * Limpiar todos los errores de un formulario
   */
  clearErrors(form) {
    form.querySelectorAll('.form-input-error').forEach(el => {
      el.classList.remove('form-input-error');
    });
    form.querySelectorAll('.form-input-valid').forEach(el => {
      el.classList.remove('form-input-valid');
    });
    form.querySelectorAll('.form-error-msg').forEach(el => {
      el.remove();
    });
  },

  /**
   * Vincular validación en tiempo real (on blur) a un formulario
   * @param {HTMLFormElement} form
   * @param {Object} rules
   */
  bindRealtime(form, rules) {
    for (const [fieldName, rule] of Object.entries(rules)) {
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (!input) continue;

      input.addEventListener('blur', () => {
        const value = input.value?.trim() || '';
        const error = this._validateField(value, rule, input);
        const parent = input.closest('.form-group') || input.parentElement;
        const existing = parent.querySelector('.form-error-msg');
        if (existing) existing.remove();

        if (error) {
          this._showError(input, error);
        } else if (value) {
          this._showSuccess(input);
        } else {
          input.classList.remove('form-input-error', 'form-input-valid');
        }
      });

      // Limpiar error al escribir
      input.addEventListener('input', () => {
        if (input.classList.contains('form-input-error')) {
          input.classList.remove('form-input-error');
          const parent = input.closest('.form-group') || input.parentElement;
          const existing = parent.querySelector('.form-error-msg');
          if (existing) existing.remove();
        }
      });
    }
  },
};

export default Validate;
