import { Injectable, ApplicationRef, createComponent, inject } from '@angular/core';
import { Confirmdialog } from '../confirmdialog/confirmdialog';

@Injectable({ providedIn: 'root' })
export class ConfirmdialogService {

  private appRef = inject(ApplicationRef);

  open(title: string, message: string): Promise<boolean> {

    const compRef = createComponent(Confirmdialog, {
      environmentInjector: this.appRef.injector
    });

    this.appRef.attachView(compRef.hostView);
    document.body.appendChild(compRef.location.nativeElement);

    return compRef.instance.open(title, message);
  }
}
