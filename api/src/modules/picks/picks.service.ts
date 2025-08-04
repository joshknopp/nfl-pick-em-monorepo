import { Injectable } from '@nestjs/common';
import { PickDTO } from 'libs';
import * as admin from 'firebase-admin';
import { Observable, from } from 'rxjs';

interface User {
  id: string;
  // add other user properties as needed
}

@Injectable()
export class PicksService {
  getUserPicks(user: User): Observable<PickDTO[]> {
    return from(
      admin
        .firestore()
        .collection('picks')
        .where('user', '==', user.id)
        .get()
        .then((snapshot) => snapshot.docs.map((doc) => doc.data() as PickDTO))
    );
  }

  getLeaguePicks(): Observable<PickDTO[]> {
    return from(
      admin
        .firestore()
        .collection('picks')
        .get()
        .then((snapshot) => snapshot.docs.map((doc) => doc.data() as PickDTO))
    );
  }

  saveUserPick(user: User, picksDto: PickDTO): Observable<PickDTO> {
    const pick = { ...picksDto, user: user.id };
    return from(
      admin
        .firestore()
        .collection('picks')
        .add(pick)
        .then(() => pick)
    );
  }
}
